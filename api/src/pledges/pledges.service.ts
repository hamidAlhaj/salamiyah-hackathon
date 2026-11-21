import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type Role } from '@prisma/client';
import type {
  CreatePledgeResult,
  OfficialReceipt,
  PaymentInstructions,
  PledgeView,
} from '../common/shared';
import { AuditService } from '../audit/audit.service';
import { newPledgeRef } from '../common/utils/codes';
import { money } from '../common/utils/money';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type {
  CollectorPledgeDto,
  CouncilPledgeDto,
  CreatePledgeDto,
  DemoPledgeDto,
} from './pledges.dto';

const pledgeInclude = {
  campaign: { select: { id: true, slug: true, titleAr: true } },
  verifications: {
    where: { status: 'REJECTED' },
    orderBy: { decidedAt: 'desc' },
    take: 1,
    select: { reason: true },
  },
} satisfies Prisma.PledgeInclude;

type PledgeWithRefs = Prisma.PledgeGetPayload<{ include: typeof pledgeInclude }>;

const FINANCE_ROLES: Role[] = ['FINANCE_VERIFIER', 'ADMIN'];

@Injectable()
export class PledgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly access: RoleAccessService,
  ) {}

  /** FR-13: تعهد من المنصة — الإيصال الرسمي سيكون باسم المتبرع المسجّل. */
  async create(dto: CreatePledgeDto, actor: AuthenticatedUser): Promise<CreatePledgeResult> {
    this.access.requireRole(actor, ['DONOR']);
    const donor = await this.prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
    await this.assertCampaignOpen(dto.campaignId);
    const pledge = await this.prisma.$transaction(async (tx) => {
      const p = await tx.pledge.create({
        data: {
          referenceNo: newPledgeRef(),
          campaignId: dto.campaignId,
          donorId: donor.id,
          donorName: donor.fullName,
          donorPhone: donor.phone,
          isAnonymousDisplay: dto.isAnonymousDisplay ?? false,
          amount: dto.amount,
          currency: await this.campaignCurrency(tx, dto.campaignId),
          channel: 'PLATFORM',
          method: dto.method,
          status: 'PLEDGED',
        },
        include: pledgeInclude,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'pledge.create',
          entityType: 'Pledge',
          entityId: p.id,
          after: { amount: dto.amount },
        },
        tx,
      );
      return p;
    });
    return {
      pledge: this.toView(pledge),
      instructions: this.instructions(pledge.referenceNo),
    };
  }

  /** FR-20: محاكاة دفع فوري — فقط في DEMO_MODE، ولا تدخل في الأرقام الحقيقية. */
  async createDemo(dto: DemoPledgeDto, actor: AuthenticatedUser): Promise<PledgeView> {
    this.access.requireRole(actor, ['DONOR']);
    if (this.config.get<string>('DEMO_MODE') !== 'true')
      throw new ForbiddenException('demo_mode_disabled');
    const donor = await this.prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
    await this.assertCampaignOpen(dto.campaignId);
    const pledge = await this.prisma.$transaction(async (tx) => {
      const ref = newPledgeRef();
      const p = await tx.pledge.create({
        data: {
          referenceNo: ref,
          campaignId: dto.campaignId,
          donorId: donor.id,
          donorName: donor.fullName,
          donorPhone: donor.phone,
          isAnonymousDisplay: dto.isAnonymousDisplay ?? false,
          amount: dto.amount,
          currency: await this.campaignCurrency(tx, dto.campaignId),
          channel: 'PLATFORM',
          method: dto.method,
          status: 'VERIFIED',
          isDemo: true,
          officialReceiptNo: `DEMO-${ref}`,
          verifiedAt: new Date(),
        },
        include: pledgeInclude,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'pledge.demo',
          entityType: 'Pledge',
          entityId: p.id,
          after: { amount: dto.amount, method: dto.method },
        },
        tx,
      );
      return p;
    });
    return this.toView(pledge);
  }

  /** FR-18: تبرع حضوري في المجلس — كاش باليد، يمر على التحقق المالي. */
  async createCouncil(dto: CouncilPledgeDto, actor: AuthenticatedUser): Promise<PledgeView> {
    this.access.requireRole(actor, ['STAFF', 'FINANCE_VERIFIER']);
    await this.assertCampaignOpen(dto.campaignId);
    const pledge = await this.prisma.$transaction(async (tx) => {
      const p = await tx.pledge.create({
        data: {
          referenceNo: newPledgeRef(),
          campaignId: dto.campaignId,
          donorName: dto.donorName,
          donorPhone: dto.donorPhone,
          isAnonymousDisplay: dto.isAnonymousDisplay ?? false,
          amount: dto.amount,
          currency: await this.campaignCurrency(tx, dto.campaignId),
          channel: 'COUNCIL',
          method: 'CASH',
          status: 'COLLECTED',
          recordedById: actor.id,
          verifications: { create: { status: 'PENDING' } },
        },
        include: pledgeInclude,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'pledge.council',
          entityType: 'Pledge',
          entityId: p.id,
          after: { amount: dto.amount },
        },
        tx,
      );
      return p;
    });
    return this.toView(pledge);
  }

  /** FR-19: حصيلة نقطة جمع — المسؤول يسجّل لنقاطه فقط، بلا صلاحية تحقق. */
  async createCollector(
    dto: CollectorPledgeDto,
    actor: AuthenticatedUser,
  ): Promise<PledgeView> {
    this.access.requireRole(actor, ['COLLECTOR']);
    const point = await this.prisma.collectionPoint.findFirst({
      where: {
        id: dto.collectionPointId,
        isActive: true,
        collectors: { some: { id: actor.id } },
      },
    });
    if (!point) throw new ForbiddenException('collection_point_not_assigned');
    await this.assertCampaignOpen(dto.campaignId);
    const pledge = await this.prisma.$transaction(async (tx) => {
      const p = await tx.pledge.create({
        data: {
          referenceNo: newPledgeRef(),
          campaignId: dto.campaignId,
          donorName: dto.donorName,
          donorPhone: dto.donorPhone,
          isAnonymousDisplay: !dto.donorName,
          amount: dto.amount,
          currency: await this.campaignCurrency(tx, dto.campaignId),
          channel: 'COLLECTOR',
          method: 'CASH',
          status: 'COLLECTED',
          collectionPointId: point.id,
          recordedById: actor.id,
          verifications: { create: { status: 'PENDING' } },
        },
        include: pledgeInclude,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'pledge.collector',
          entityType: 'Pledge',
          entityId: p.id,
          after: { amount: dto.amount, collectionPointId: point.id },
        },
        tx,
      );
      return p;
    });
    return this.toView(pledge);
  }

  async mine(actor: AuthenticatedUser): Promise<PledgeView[]> {
    this.access.requireRole(actor, ['DONOR']);
    const rows = await this.prisma.pledge.findMany({
      where: { donorId: actor.id },
      include: pledgeInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => this.toView(p));
  }

  /** ما سجّله الموظف/مسؤول نقطة الجمع بنفسه. */
  async recordedByMe(actor: AuthenticatedUser): Promise<PledgeView[]> {
    this.access.requireRole(actor, ['STAFF', 'COLLECTOR', 'FINANCE_VERIFIER']);
    const rows = await this.prisma.pledge.findMany({
      where: { recordedById: actor.id },
      include: pledgeInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((p) => this.toView(p));
  }

  async get(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PledgeView & { instructions: PaymentInstructions[] }> {
    const p = await this.prisma.pledge.findUnique({ where: { id }, include: pledgeInclude });
    if (!p) throw new NotFoundException('pledge_not_found');
    if (
      p.donorId !== actor.id &&
      p.recordedById !== actor.id &&
      !FINANCE_ROLES.includes(actor.role)
    ) {
      throw new NotFoundException('pledge_not_found');
    }
    return { ...this.toView(p), instructions: this.instructions(p.referenceNo) };
  }

  /** FR-14: رفع إيصال التحويل ← Verification(PENDING). */
  async uploadReceipt(
    id: string,
    file: Express.Multer.File | undefined,
    transferRef: string | undefined,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['DONOR', 'STAFF']);
    const p = await this.prisma.pledge.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('pledge_not_found');
    const isOwner = p.donorId === actor.id;
    if (!isOwner && actor.role !== 'STAFF') throw new NotFoundException('pledge_not_found');
    if (p.channel !== 'PLATFORM' || p.isDemo)
      throw new ConflictException('receipt_not_applicable');
    if (!['PLEDGED', 'REJECTED'].includes(p.status))
      throw new ConflictException('receipt_already_pending_or_verified');

    const stored = await this.storage.save(file, 'receipts');
    const reused = await this.prisma.receipt.findFirst({
      where: { sha256: stored.sha256, pledgeId: { not: id } },
    });
    if (reused) throw new BadRequestException('duplicate_receipt');

    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          pledgeId: id,
          storageKey: stored.storageKey,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          sha256: stored.sha256,
          transferRef,
          uploadedById: actor.id,
        },
      });
      await tx.verification.create({
        data: { pledgeId: id, receiptId: receipt.id, status: 'PENDING' },
      });
      const updated = await tx.pledge.update({
        where: { id },
        data: { status: 'RECEIPT_UPLOADED' },
        include: pledgeInclude,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'pledge.receipt_upload',
          entityType: 'Pledge',
          entityId: id,
          after: { receiptId: receipt.id },
        },
        tx,
      );
      return this.toView(updated);
    });
  }

  async cancel(id: string, actor: AuthenticatedUser): Promise<PledgeView> {
    this.access.requireRole(actor, ['DONOR']);
    const p = await this.prisma.pledge.findUnique({ where: { id } });
    if (!p || p.donorId !== actor.id) throw new NotFoundException('pledge_not_found');
    if (!['PLEDGED', 'REJECTED'].includes(p.status))
      throw new ConflictException('cannot_cancel');
    const updated = await this.prisma.pledge.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: pledgeInclude,
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'pledge.cancel',
      entityType: 'Pledge',
      entityId: id,
    });
    return this.toView(updated);
  }

  async receiptFile(
    receiptId: string,
    actor: AuthenticatedUser,
  ): Promise<{ data: Buffer; mimeType: string }> {
    const r = await this.prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { pledge: true },
    });
    if (!r) throw new NotFoundException('receipt_not_found');
    if (r.pledge.donorId !== actor.id && !FINANCE_ROLES.includes(actor.role))
      throw new NotFoundException('receipt_not_found');
    return { data: await this.storage.read(r.storageKey), mimeType: r.mimeType };
  }

  /** FR-16: الإيصال الرسمي — عام برقمه. الاسم يُخفى إن اختار «فاعل خير». */
  async officialReceipt(receiptNo: string): Promise<OfficialReceipt> {
    const p = await this.prisma.pledge.findUnique({
      where: { officialReceiptNo: receiptNo },
      include: { campaign: { select: { slug: true, titleAr: true } } },
    });
    if (!p || p.status !== 'VERIFIED' || !p.verifiedAt)
      throw new NotFoundException('receipt_not_found');
    return {
      receiptNo,
      donorName: p.isAnonymousDisplay ? '' : (p.donorName ?? ''),
      amount: money(p.amount),
      currency: p.currency,
      campaignTitle: p.campaign.titleAr,
      campaignSlug: p.campaign.slug,
      verifiedAt: p.verifiedAt.toISOString(),
    };
  }

  /** تعليمات التحويل. بيانات الحساب من البيئة حتى يرسلها المجلس (سؤال مفتوح Q2). */
  instructions(referenceNo: string): PaymentInstructions[] {
    return [
      {
        method: 'BEMO_TRANSFER',
        bankName: 'بنك بيمو السعودي الفرنسي',
        accountName: this.config.get<string>('BEMO_ACCOUNT_NAME') ?? '',
        accountNumber: this.config.get<string>('BEMO_ACCOUNT_NUMBER') ?? '',
        note: `اكتب رقم التعهد ${referenceNo} في ملاحظة التحويل، ثم صوّر الإيصال وارفعه.`,
      },
    ];
  }

  private async assertCampaignOpen(campaignId: string): Promise<void> {
    const c = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true, acceptsPledges: true },
    });
    if (!c) throw new NotFoundException('campaign_not_found');
    if (c.status !== 'ACTIVE' || !c.acceptsPledges)
      throw new ConflictException('campaign_not_accepting_pledges');
  }

  private async campaignCurrency(tx: Prisma.TransactionClient, campaignId: string) {
    const c = await tx.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: { currency: true },
    });
    return c.currency;
  }

  private toView(p: PledgeWithRefs): PledgeView {
    return {
      id: p.id,
      referenceNo: p.referenceNo,
      campaignId: p.campaign.id,
      campaignSlug: p.campaign.slug,
      campaignTitle: p.campaign.titleAr,
      amount: money(p.amount),
      currency: p.currency,
      channel: p.channel,
      method: p.method,
      status: p.status,
      isDemo: p.isDemo,
      isAnonymousDisplay: p.isAnonymousDisplay,
      officialReceiptNo: p.officialReceiptNo,
      rejectionReason: p.status === 'REJECTED' ? (p.verifications[0]?.reason ?? null) : null,
      createdAt: p.createdAt.toISOString(),
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
    };
  }
}
