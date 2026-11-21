import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Paginated, PublicCampaign, PublicCampaignDetail } from '../common/shared';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { newCampaignSlug } from '../common/utils/codes';
import { money } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignStatsService, type CampaignStats } from './campaign-stats.service';
import type {
  CreateCampaignUpdateDto,
  CreateOngoingCampaignDto,
  ListCampaignsQueryDto,
  UpdateCampaignStatusDto,
} from './campaigns.dto';

const publicInclude = {
  hospital: { select: { nameAr: true, nameEn: true } },
  case: { select: { category: true, isAnonymous: true, trackingNo: true } },
} satisfies Prisma.CampaignInclude;

type CampaignWithRefs = Prisma.CampaignGetPayload<{ include: typeof publicInclude }>;

/** الحالات المعروضة للعامة. */
const PUBLIC_STATUSES = ['ACTIVE', 'FUNDED', 'COMPLETED'] as const;

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: CampaignStatsService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  async listPublic(query: ListCampaignsQueryDto): Promise<Paginated<PublicCampaign>> {
    const where: Prisma.CampaignWhereInput = {
      type: 'MEDICAL',
      status: { in: [...PUBLIC_STATUSES] },
      ...(query.priority ? { priority: query.priority } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        include: publicInclude,
        // ACTIVE أولاً، ثم الأكثر استعجالاً، ثم الأحدث
        orderBy: [{ status: 'asc' }, { priority: 'asc' }, { publishedAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const stats = await this.stats.forCampaigns(rows.map((r) => r.id));
    return {
      items: rows.map((r) => this.toPublic(r, stats.get(r.id), query.lang)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getPublic(slug: string, lang: 'ar' | 'en'): Promise<PublicCampaignDetail> {
    const row = await this.prisma.campaign.findFirst({
      where: { slug, status: { in: [...PUBLIC_STATUSES] } },
      include: { ...publicInclude, updates: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!row) throw new NotFoundException('campaign_not_found');
    const stats = await this.stats.forCampaigns([row.id]);
    return {
      ...this.toPublic(row, stats.get(row.id), lang),
      fileNo: row.case?.trackingNo ?? null,
      updates: row.updates.map((u) => ({
        id: u.id,
        body: lang === 'en' && u.bodyEn ? u.bodyEn : u.bodyAr,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  /** الشفافية: المتحقق، بانتظار التحقق، المصروف ولأي مشفى (FR-23). */
  async transparency(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        disbursements: {
          select: {
            id: true,
            amount: true,
            currency: true,
            paidAt: true,
            hospital: { select: { nameAr: true, nameEn: true } },
          },
          orderBy: { paidAt: 'desc' },
        },
      },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    const stats = (await this.stats.forCampaigns([id])).get(id);
    return {
      campaignId: id,
      currency: campaign.currency,
      targetAmount: money(campaign.targetAmount),
      verifiedAmount: money(campaign.verifiedAmount.plus(stats?.demo ?? 0)),
      pendingAmount: money(stats?.pending),
      disbursedAmount: money(campaign.disbursedAmount),
      disbursements: campaign.disbursements.map((d) => ({
        id: d.id,
        amount: money(d.amount),
        currency: d.currency,
        paidAt: d.paidAt.toISOString(),
        hospital: d.hospital.nameAr,
        hospitalEn: d.hospital.nameEn,
      })),
    };
  }

  async createOngoing(dto: CreateOngoingCampaignDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const actorId = actor.id;
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          slug: newCampaignSlug('program'),
          isOngoing: true,
          titleAr: dto.titleAr,
          titleEn: dto.titleEn,
          summaryAr: dto.summaryAr,
          summaryEn: dto.summaryEn,
          targetAmount: dto.targetAmount,
          currency: dto.currency,
          priority: dto.priority,
          status: 'ACTIVE',
          publishedAt: new Date(),
          createdById: actorId,
        },
      });
      await this.audit.log(
        {
          actorId,
          action: 'campaign.create_ongoing',
          entityType: 'Campaign',
          entityId: campaign.id,
          after: { slug: campaign.slug },
        },
        tx,
      );
      return campaign;
    });
  }

  async updateStatus(id: string, dto: UpdateCampaignStatusDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'CASE_OFFICER']);
    const actorId = actor.id;
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.campaign.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('campaign_not_found');
      const after = await tx.campaign.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.acceptsPledges === undefined ? {} : { acceptsPledges: dto.acceptsPledges }),
        },
      });
      await this.audit.log(
        {
          actorId,
          action: 'campaign.status',
          entityType: 'Campaign',
          entityId: id,
          before: { status: before.status, acceptsPledges: before.acceptsPledges },
          after: { status: after.status, acceptsPledges: after.acceptsPledges },
        },
        tx,
      );
      return after;
    });
  }

  async addUpdate(campaignId: string, dto: CreateCampaignUpdateDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['STAFF', 'CASE_OFFICER', 'ADMIN']);
    const authorId = actor.id;
    const exists = await this.prisma.campaign.count({ where: { id: campaignId } });
    if (!exists) throw new NotFoundException('campaign_not_found');
    return this.prisma.campaignUpdate.create({
      data: { campaignId, authorId, bodyAr: dto.bodyAr, bodyEn: dto.bodyEn },
    });
  }

  /** لوحة الموظفين: كل الحملات مع الحالة. */
  listForStaff(user: AuthenticatedUser) {
    this.access.requireRole(user, [
      'ADMIN',
      'CASE_OFFICER',
      'FINANCE_VERIFIER',
      'STAFF',
      'COLLECTOR',
    ]);
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        titleAr: true,
        status: true,
        acceptsPledges: true,
        priority: true,
        currency: true,
        targetAmount: true,
        verifiedAmount: true,
        disbursedAmount: true,
        hospital: { select: { id: true, nameAr: true } },
      },
    });
  }

  private toPublic(
    row: CampaignWithRefs,
    stats: CampaignStats | undefined,
    lang: 'ar' | 'en',
  ): PublicCampaign {
    const en = lang === 'en';
    return {
      id: row.id,
      slug: row.slug,
      type: row.type,
      isOngoing: row.isOngoing,
      title: en && row.titleEn ? row.titleEn : row.titleAr,
      summary: en && row.summaryEn ? row.summaryEn : row.summaryAr,
      category: row.case?.category ?? null,
      priority: row.priority,
      status: row.status,
      currency: row.currency,
      targetAmount: money(row.targetAmount),
      verifiedAmount: money(row.verifiedAmount.plus(stats?.demo ?? 0)),
      pendingAmount: money(stats?.pending),
      disbursedAmount: money(row.disbursedAmount),
      hospitalName: row.hospital
        ? en && row.hospital.nameEn
          ? row.hospital.nameEn
          : row.hospital.nameAr
        : null,
      acceptsPledges: row.acceptsPledges && row.status === 'ACTIVE',
      isAnonymousCase: row.case?.isAnonymous ?? false,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      donorsCount: stats?.donorsCount ?? 0,
    };
  }
}
