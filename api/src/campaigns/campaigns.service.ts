import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  category: { select: { id: true, code: true, nameAr: true, nameEn: true, icon: true } },
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
    // All categories are public (the category filter arrives with the categories API in P06).
    const where: Prisma.CampaignWhereInput = {
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

  /** Per-campaign transparency: verified, pending, demo (separate), spent and the public-safe spending list. */
  async transparency(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        expenditures: {
          select: {
            id: true,
            payeeType: true,
            payeeLabel: true,
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
      verifiedAmount: money(campaign.verifiedAmount),
      pendingAmount: money(stats?.pending),
      demoAmount: money(stats?.demo),
      spentAmount: money(campaign.spentAmount),
      remainingAmount: money(campaign.verifiedAmount.minus(campaign.spentAmount)),
      expenditures: campaign.expenditures.map((e) => ({
        id: e.id,
        payeeType: e.payeeType,
        payee: e.payeeLabel,
        hospital: e.hospital?.nameAr ?? null,
        hospitalEn: e.hospital?.nameEn ?? null,
        amount: money(e.amount),
        currency: e.currency,
        paidAt: e.paidAt.toISOString(),
      })),
    };
  }

  /**
   * ADMIN creates a direct (ongoing) campaign in an active category. Categories whose campaigns come from
   * the medical case pipeline (`requiresMedicalCase`) are refused here. Full create API: P06.
   */
  async createOngoing(dto: CreateOngoingCampaignDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const actorId = actor.id;
    const category = await this.prisma.campaignCategory.findUnique({
      where: { id: dto.categoryId },
      select: { id: true, isActive: true, requiresMedicalCase: true },
    });
    if (!category || !category.isActive) throw new NotFoundException('category_not_found');
    if (category.requiresMedicalCase)
      throw new ConflictException('category_requires_medical_case');
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          slug: newCampaignSlug('program'),
          categoryId: category.id,
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
        spentAmount: true,
        category: { select: { id: true, code: true, nameAr: true, icon: true } },
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
      category: {
        id: row.category.id,
        code: row.category.code,
        name: en ? row.category.nameEn : row.category.nameAr,
        icon: row.category.icon,
      },
      isOngoing: row.isOngoing,
      title: en && row.titleEn ? row.titleEn : row.titleAr,
      summary: en && row.summaryEn ? row.summaryEn : row.summaryAr,
      coverKey: row.coverKey,
      area: row.area,
      caseCategory: row.case?.category ?? null,
      priority: row.priority,
      status: row.status,
      currency: row.currency,
      targetAmount: money(row.targetAmount),
      // Demo money is reported separately and never added to verified money.
      verifiedAmount: money(row.verifiedAmount),
      pendingAmount: money(stats?.pending),
      demoAmount: money(stats?.demo),
      spentAmount: money(row.spentAmount),
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
