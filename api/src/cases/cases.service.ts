import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type Role } from '@prisma/client';
import { DEFAULT_SLA_DAYS } from '../common/shared';
import { AuditService } from '../audit/audit.service';
import { newCampaignSlug, newTrackingNo } from '../common/utils/codes';
import { money, toDecimal } from '../common/utils/money';
import { allocateBeneficiaryCodes } from '../common/utils/beneficiary-codes';
import { hashNationalId } from '../common/utils/national-id';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type {
  ChangeHospitalAmountDto,
  CreateCaseDto,
  ListCasesQueryDto,
  PublishCaseDto,
  ReviewCaseDto,
} from './cases.dto';

const REVIEWABLE = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO'] as const;
const CASE_READERS: Role[] = ['STAFF', 'CASE_OFFICER', 'ADMIN'];
const DOCUMENT_READERS: Role[] = ['STAFF', 'CASE_OFFICER', 'ADMIN', 'FINANCE_VERIFIER'];

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly access: RoleAccessService,
  ) {}

  private get slaDays(): number {
    return Number(this.config.get<string>('SLA_DAYS') ?? DEFAULT_SLA_DAYS);
  }

  /** FR-06 + FR-10: تسجيل طلب مع كشف الازدواجية (تنبيه غير مانع). */
  async create(
    dto: CreateCaseDto,
    file: Express.Multer.File | undefined,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['STAFF', 'ADMIN']);
    const { hash, last4 } = hashNationalId(
      dto.nationalId,
      this.config.getOrThrow<string>('NATIONAL_ID_HMAC_KEY'),
    );
    const stored = await this.storage.save(file, 'cases');

    return this.prisma.$transaction(async (tx) => {
      let beneficiary = await tx.beneficiary.findFirst({ where: { nationalIdHash: hash } });
      if (beneficiary?.isSuspended) {
        // FR-25: تعليق إداري صامت — رسالة عامة بلا تفاصيل
        throw new ForbiddenException('cannot_submit_request');
      }
      const duplicates = beneficiary
        ? await tx.case.findMany({
            where: {
              beneficiaryId: beneficiary.id,
              status: { notIn: ['REJECTED', 'CLOSED'] },
            },
            select: { id: true, trackingNo: true, status: true, createdAt: true },
          })
        : [];
      const phoneMatches = await tx.beneficiary.findMany({
        where: {
          phone: dto.beneficiaryPhone,
          ...(beneficiary ? { id: { not: beneficiary.id } } : {}),
        },
        select: { id: true, fullName: true, otherPrograms: true },
        take: 5,
      });

      if (!beneficiary) {
        const [publicCode] = await allocateBeneficiaryCodes(tx, 1);
        beneficiary = await tx.beneficiary.create({
          data: {
            publicCode,
            kind: 'PATIENT',
            fullName: dto.beneficiaryName,
            phone: dto.beneficiaryPhone,
            nationalIdHash: hash,
            nationalIdLast4: last4,
            localCouncil: dto.localCouncil,
          },
        });
      }

      const now = new Date();
      const created = await tx.case.create({
        data: {
          trackingNo: newTrackingNo(now),
          beneficiaryId: beneficiary.id,
          category: dto.category,
          description: dto.description,
          requestedAmount: dto.requestedAmount,
          currency: dto.currency ?? 'SYP',
          submittedById: actor.id,
          slaDueAt: new Date(now.getTime() + this.slaDays * 86_400_000),
          documents: {
            create: {
              kind: 'MEDICAL_REPORT',
              storageKey: stored.storageKey,
              originalName: file?.originalname ?? 'medical-report',
              mimeType: stored.mimeType,
              sizeBytes: stored.sizeBytes,
              sha256: stored.sha256,
              uploadedById: actor.id,
            },
          },
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'case.submit',
          entityType: 'Case',
          entityId: created.id,
          after: { trackingNo: created.trackingNo },
        },
        tx,
      );
      return {
        id: created.id,
        trackingNo: created.trackingNo,
        warnings: {
          openCasesForSameNationalId: duplicates,
          otherBeneficiariesWithSamePhone: phoneMatches,
          otherPrograms: beneficiary.otherPrograms,
        },
      };
    });
  }

  async list(query: ListCasesQueryDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, CASE_READERS);
    const now = new Date();
    const where: Prisma.CaseWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.overdue ? { status: { in: [...REVIEWABLE] }, slaDueAt: { lt: now } } : {}),
    };
    const rows = await this.prisma.case.findMany({
      where,
      orderBy: [{ slaDueAt: 'asc' }, { createdAt: 'asc' }],
      take: 200,
      include: {
        beneficiary: { select: { fullName: true, localCouncil: true } },
        hospital: { select: { id: true, nameAr: true } },
        campaign: { select: { id: true, slug: true, acceptsPledges: true } },
      },
    });
    return rows.map((c) => ({
      id: c.id,
      trackingNo: c.trackingNo,
      status: c.status,
      priority: c.priority,
      route: c.route,
      category: c.category,
      beneficiaryName: c.beneficiary.fullName,
      localCouncil: c.beneficiary.localCouncil,
      requestedAmount: money(c.requestedAmount),
      approvedAmount: c.approvedAmount ? money(c.approvedAmount) : null,
      currency: c.currency,
      hospital: c.hospital,
      campaign: c.campaign,
      isOverdue:
        (REVIEWABLE as readonly string[]).includes(c.status) &&
        !!c.slaDueAt &&
        c.slaDueAt < now,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async get(id: string, actor: AuthenticatedUser) {
    this.access.requireRole(actor, CASE_READERS);
    const c = await this.prisma.case.findUnique({
      where: { id },
      include: {
        beneficiary: true,
        hospital: true,
        submittedBy: { select: { id: true, fullName: true } },
        reviewedBy: { select: { id: true, fullName: true } },
        documents: {
          select: {
            id: true,
            kind: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        campaign: {
          select: {
            id: true,
            slug: true,
            status: true,
            acceptsPledges: true,
            verifiedAmount: true,
          },
        },
      },
    });
    if (!c) throw new NotFoundException('case_not_found');
    const history = await this.prisma.case.findMany({
      where: { beneficiaryId: c.beneficiaryId, id: { not: c.id } },
      select: { id: true, trackingNo: true, status: true, category: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const beneficiary = { ...c.beneficiary, nationalIdHash: undefined };
    return {
      ...c,
      beneficiary,
      requestedAmount: money(c.requestedAmount),
      approvedAmount: c.approvedAmount ? money(c.approvedAmount) : null,
      campaign: c.campaign
        ? { ...c.campaign, verifiedAmount: money(c.campaign.verifiedAmount) }
        : null,
      beneficiaryHistory: history,
    };
  }

  /** FR-07: اعتماد / رفض / طلب معلومات. */
  async review(id: string, dto: ReviewCaseDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['CASE_OFFICER']);
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.case.findUnique({ where: { id }, include: { campaign: true } });
      if (!c) throw new NotFoundException('case_not_found');
      if (!(REVIEWABLE as readonly string[]).includes(c.status))
        throw new ConflictException('case_not_reviewable');

      let data: Prisma.CaseUpdateInput;
      if (dto.decision === 'approve') {
        const hospital = await tx.hospital.findFirst({
          where: { id: dto.hospitalId, isActive: true },
        });
        if (!hospital) throw new BadRequestException('hospital_not_found');
        data = {
          status: 'APPROVED',
          priority: dto.priority,
          route: dto.route,
          hospital: { connect: { id: hospital.id } },
          doctorName: dto.doctorName,
          approvedAmount: dto.approvedAmount,
          rejectionReason: null,
        };
      } else {
        data = {
          status: dto.decision === 'reject' ? 'REJECTED' : 'NEEDS_INFO',
          rejectionReason: dto.reason,
        };
      }
      const updated = await tx.case.update({
        where: { id },
        data: { ...data, reviewedBy: { connect: { id: actor.id } }, reviewedAt: new Date() },
      });

      // حالة منشورة أُعيدت للمراجعة (FR-09) ثم اعتُمدت: نحدّث الحملة ونعيد فتح التعهدات
      if (dto.decision === 'approve' && c.campaign) {
        await tx.campaign.update({
          where: { id: c.campaign.id },
          data: {
            hospitalId: updated.hospitalId,
            targetAmount: updated.approvedAmount ?? c.campaign.targetAmount,
            priority: updated.priority ?? c.campaign.priority,
            acceptsPledges: true,
          },
        });
        await tx.case.update({ where: { id }, data: { status: 'PUBLISHED' } });
      }

      await this.audit.log(
        {
          actorId: actor.id,
          action: `case.${dto.decision}`,
          entityType: 'Case',
          entityId: id,
          before: { status: c.status },
          after: {
            status: updated.status,
            priority: updated.priority,
            route: updated.route,
            hospitalId: updated.hospitalId,
            approvedAmount: updated.approvedAmount ? money(updated.approvedAmount) : null,
            reason: dto.reason ?? null,
          },
        },
        tx,
      );
      return {
        id,
        status: dto.decision === 'approve' && c.campaign ? 'PUBLISHED' : updated.status,
      };
    });
  }

  /**
   * FR-09 (سيناريو 15 ← 25 مليون): تغيير المشفى أو زيادة المبلغ بعد الاعتماد
   * يعيد الحالة إلى UNDER_REVIEW ويوقف قبول التعهدات حتى اعتماد جديد.
   */
  async changeHospitalOrAmount(
    id: string,
    dto: ChangeHospitalAmountDto,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['CASE_OFFICER', 'ADMIN']);
    if (!dto.hospitalId && !dto.approvedAmount)
      throw new BadRequestException('nothing_to_change');
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.case.findUnique({ where: { id }, include: { campaign: true } });
      if (!c) throw new NotFoundException('case_not_found');
      if (!['APPROVED', 'PUBLISHED'].includes(c.status))
        throw new ConflictException('case_not_approved');

      const hospitalChanged = !!dto.hospitalId && dto.hospitalId !== c.hospitalId;
      const newAmount = dto.approvedAmount ? toDecimal(dto.approvedAmount) : null;
      const amountIncreased =
        !!newAmount && !!c.approvedAmount && newAmount.greaterThan(c.approvedAmount);
      const needsReview = hospitalChanged || amountIncreased;

      if (hospitalChanged) {
        const hospital = await tx.hospital.findFirst({
          where: { id: dto.hospitalId, isActive: true },
        });
        if (!hospital) throw new BadRequestException('hospital_not_found');
      }

      const updated = await tx.case.update({
        where: { id },
        data: {
          ...(hospitalChanged ? { hospitalId: dto.hospitalId } : {}),
          ...(newAmount ? { approvedAmount: newAmount } : {}),
          ...(needsReview
            ? {
                status: 'UNDER_REVIEW',
                slaDueAt: new Date(Date.now() + this.slaDays * 86_400_000),
              }
            : {}),
        },
      });
      if (c.campaign) {
        await tx.campaign.update({
          where: { id: c.campaign.id },
          data: needsReview
            ? { acceptsPledges: false }
            : { targetAmount: newAmount ?? c.campaign.targetAmount },
        });
      }
      await this.audit.log(
        {
          actorId: actor.id,
          action: needsReview
            ? 'case.hospital_amount_change_requires_review'
            : 'case.amount_decrease',
          entityType: 'Case',
          entityId: id,
          before: {
            hospitalId: c.hospitalId,
            approvedAmount: c.approvedAmount ? money(c.approvedAmount) : null,
            status: c.status,
          },
          after: {
            hospitalId: updated.hospitalId,
            approvedAmount: updated.approvedAmount ? money(updated.approvedAmount) : null,
            status: updated.status,
            reason: dto.reason,
          },
        },
        tx,
      );
      return {
        id,
        status: updated.status,
        requiresReview: needsReview,
        pledgesPaused: needsReview && !!c.campaign,
      };
    });
  }

  /** FR-08: نشر الحالة المعتمدة كحملة (redactedSummary إلزامي). */
  async publish(id: string, dto: PublishCaseDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['CASE_OFFICER']);
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.case.findUnique({ where: { id }, include: { campaign: true } });
      if (!c) throw new NotFoundException('case_not_found');
      if (c.status !== 'APPROVED') throw new ConflictException('case_not_approved');
      if (c.route !== 'CROWDFUNDING') throw new ConflictException('route_not_crowdfunding');
      if (c.campaign) throw new ConflictException('already_published');
      if (!c.approvedAmount || !c.hospitalId)
        throw new ConflictException('missing_approval_data');

      // The category is chosen by its behaviour flag, never by its code.
      const category = await tx.campaignCategory.findFirst({
        where: { requiresMedicalCase: true, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true },
      });
      if (!category) throw new ConflictException('no_medical_category');

      const isAnonymous = dto.isAnonymous ?? true;
      const campaign = await tx.campaign.create({
        data: {
          slug: newCampaignSlug(c.category),
          categoryId: category.id,
          caseId: c.id,
          titleAr: dto.titleAr,
          titleEn: dto.titleEn,
          summaryAr: dto.redactedSummary,
          summaryEn: dto.summaryEn,
          priority: c.priority ?? 'NORMAL',
          targetAmount: c.approvedAmount,
          currency: c.currency,
          hospitalId: c.hospitalId,
          status: 'ACTIVE',
          publishedAt: new Date(),
          createdById: actor.id,
        },
      });
      // The patient is linked to the campaign anonymised (public: code, kind, area only).
      await tx.campaignBeneficiary.create({
        data: { campaignId: campaign.id, beneficiaryId: c.beneficiaryId },
      });
      await tx.case.update({
        where: { id },
        data: { status: 'PUBLISHED', isAnonymous, redactedSummary: dto.redactedSummary },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'case.publish',
          entityType: 'Case',
          entityId: id,
          after: { campaignId: campaign.id, slug: campaign.slug, isAnonymous },
        },
        tx,
      );
      return { campaignId: campaign.id, slug: campaign.slug };
    });
  }

  /** FR-12: تتبع الطلب للمستفيد — المرحلة فقط، بلا مبالغ أو تفاصيل طبية. */
  async track(trackingNo: string, phoneLast4: string) {
    const c = await this.prisma.case.findUnique({
      where: { trackingNo: trackingNo.trim().toUpperCase() },
      include: {
        beneficiary: { select: { phone: true } },
        campaign: { select: { status: true } },
      },
    });
    if (!c || !c.beneficiary.phone?.endsWith(phoneLast4))
      throw new NotFoundException('case_not_found');
    const stage =
      c.campaign?.status === 'COMPLETED'
        ? 'DISBURSED'
        : c.status === 'PUBLISHED'
          ? 'PUBLISHED'
          : c.status === 'APPROVED'
            ? 'APPROVED'
            : c.status === 'SUBMITTED'
              ? 'RECEIVED'
              : c.status === 'REJECTED'
                ? 'REJECTED'
                : c.status === 'NEEDS_INFO'
                  ? 'NEEDS_INFO'
                  : c.status === 'CLOSED'
                    ? 'CLOSED'
                    : 'UNDER_REVIEW';
    return { trackingNo: c.trackingNo, stage, updatedAt: c.updatedAt.toISOString() };
  }

  async documentFile(
    documentId: string,
    actor: AuthenticatedUser,
  ): Promise<{ data: Buffer; mimeType: string; name: string }> {
    this.access.requireRole(actor, DOCUMENT_READERS);
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('document_not_found');
    return {
      data: await this.storage.read(doc.storageKey),
      mimeType: doc.mimeType,
      name: doc.originalName,
    };
  }
}
