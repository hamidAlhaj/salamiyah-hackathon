import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type CampaignStatus, type CaseStatus } from '@prisma/client';
import type {
  CampaignLedger,
  Paginated,
  PublicCampaign,
  PublicCampaignDetail,
} from '../common/shared';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { newCampaignSlug } from '../common/utils/codes';
import { money } from '../common/utils/money';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { computeLedger } from './campaign-ledger';
import { CampaignStatsService, type CampaignStats } from './campaign-stats.service';
import type {
  CreateCampaignDto,
  CreateCampaignUpdateDto,
  ListCampaignsQueryDto,
  UpdateCampaignDto,
  UpdateCampaignStatusDto,
} from './campaigns.dto';

/** Only active beneficiary links are counted. */
const activeBeneficiariesCount = {
  _count: { select: { beneficiaries: { where: { endedAt: null } } } },
} satisfies Prisma.CampaignInclude;

/** Everything a public campaign response reads. No beneficiary relation: counts only. */
const publicInclude = {
  category: { select: { id: true, code: true, nameAr: true, nameEn: true, icon: true } },
  hospital: { select: { nameAr: true, nameEn: true } },
  case: { select: { category: true, isAnonymous: true, trackingNo: true } },
  ...activeBeneficiariesCount,
} satisfies Prisma.CampaignInclude;

type CampaignWithRefs = Prisma.CampaignGetPayload<{ include: typeof publicInclude }>;

/** Campaign statuses visible to the public. */
export const PUBLIC_STATUSES = ['ACTIVE', 'FUNDED', 'COMPLETED'] as const;

/** Pledges still on their way to verification (money may yet arrive). */
const OPEN_PLEDGE_STATUSES = ['PLEDGED', 'RECEIPT_UPLOADED', 'COLLECTED'] as const;

/** The fields the management page may edit. */
const EDITABLE_SELECT = {
  titleAr: true,
  titleEn: true,
  summaryAr: true,
  summaryEn: true,
  coverKey: true,
  area: true,
  priority: true,
} satisfies Prisma.CampaignSelect;

/**
 * Lifecycle rules, as stable error codes (null = allowed):
 * - a CLOSED campaign is final, and a COMPLETED one can only be closed (it does not reopen);
 * - a published campaign never goes back to DRAFT;
 * - CLOSED hides the campaign from every public page and total, so only a campaign without verified
 *   money and without pledges still on their way can be closed (otherwise: mark it completed);
 * - pledges of a medical campaign whose case went back to review resume only when the case officer
 *   publishes the case again.
 */
export function lifecycleProblem(input: {
  from: CampaignStatus;
  to: CampaignStatus;
  publishedAt: Date | null;
  resume: boolean;
  caseStatus: CaseStatus | null;
  verifiedAmount: Prisma.Decimal;
  openPledges: number;
}): string | null {
  if (input.from === 'CLOSED') return 'campaign_closed';
  if (input.from === 'COMPLETED' && input.to !== 'COMPLETED' && input.to !== 'CLOSED') {
    return 'campaign_completed';
  }
  if (input.to === 'DRAFT' && input.publishedAt) return 'campaign_already_published';
  if (
    input.to === 'CLOSED' &&
    (input.verifiedAmount.greaterThan(0) || input.openPledges > 0)
  ) {
    return 'campaign_has_money';
  }
  if (input.resume && input.caseStatus !== null && input.caseStatus !== 'PUBLISHED') {
    return 'case_review_pending';
  }
  return null;
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: CampaignStatsService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async listPublic(query: ListCampaignsQueryDto): Promise<Paginated<PublicCampaign>> {
    const where: Prisma.CampaignWhereInput = {
      status: query.status ? query.status : { in: [...PUBLIC_STATUSES] },
      // The general council fund has its own page and call to action, not a card among campaigns.
      isGeneralFund: false,
      // The category filter is a public display filter by code, not a business rule.
      ...(query.category ? { category: { code: query.category, isActive: true } } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        include: publicInclude,
        // ACTIVE first, then the most urgent, then the newest.
        orderBy: [{ status: 'asc' }, { priority: 'asc' }, { publishedAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const stats = await this.stats.forCampaigns(rows.map((r) => r.id));
    return {
      items: rows.map((r) => toPublicCampaign(r, stats.get(r.id), query.lang)),
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
      ...toPublicCampaign(row, stats.get(row.id), lang),
      fileNo: row.case?.trackingNo ?? null,
      updates: row.updates.map((u) => ({
        id: u.id,
        body: lang === 'en' && u.bodyEn ? u.bodyEn : u.bodyAr,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  /** The campaign account ledger (public): remaining = verified − spent; pending and demo apart. */
  async ledger(id: string): Promise<CampaignLedger> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, status: { in: [...PUBLIC_STATUSES] } },
      select: {
        id: true,
        currency: true,
        targetAmount: true,
        verifiedAmount: true,
        spentAmount: true,
        ...activeBeneficiariesCount,
      },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    const stats = (await this.stats.forCampaigns([id])).get(id);
    return computeLedger({
      campaignId: campaign.id,
      currency: campaign.currency,
      targetAmount: campaign.targetAmount,
      verifiedAmount: campaign.verifiedAmount,
      spentAmount: campaign.spentAmount,
      pending: stats?.pending,
      demo: stats?.demo,
      donorsCount: stats?.donorsCount,
      beneficiariesCount: campaign._count.beneficiaries,
    });
  }

  /** Per-campaign transparency: the ledger plus the public-safe spending list. */
  async transparency(id: string) {
    const ledger = await this.ledger(id);
    const expenditures = await this.prisma.expenditure.findMany({
      where: { campaignId: id },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        payeeType: true,
        payeeLabel: true,
        amount: true,
        currency: true,
        paidAt: true,
        periodMonth: true,
        hospital: { select: { nameAr: true, nameEn: true } },
        beneficiary: { select: { publicCode: true } },
      },
    });
    return {
      ...ledger,
      expenditures: expenditures.map((e) => ({
        id: e.id,
        payeeType: e.payeeType,
        payee: e.payeeLabel,
        hospital: e.hospital?.nameAr ?? null,
        hospitalEn: e.hospital?.nameEn ?? null,
        beneficiaryCode: e.beneficiary?.publicCode ?? null,
        amount: money(e.amount),
        currency: e.currency,
        paidAt: e.paidAt.toISOString(),
        periodMonth: e.periodMonth,
      })),
    };
  }

  /**
   * ADMIN creates a campaign in an active category. A category flagged `requiresMedicalCase` is refused:
   * its campaigns only come from the case intake → review → publish pipeline (CASE_OFFICER).
   */
  async create(dto: CreateCampaignDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const category = await this.prisma.campaignCategory.findUnique({
      where: { id: dto.categoryId },
      select: { id: true, code: true, isActive: true, requiresMedicalCase: true },
    });
    if (!category || !category.isActive) throw new NotFoundException('category_not_found');
    if (category.requiresMedicalCase) {
      throw new ConflictException('category_requires_medical_case');
    }
    const publish = (dto.status ?? 'ACTIVE') === 'ACTIVE';
    const created = await this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          slug: newCampaignSlug(category.code),
          categoryId: category.id,
          isOngoing: dto.isOngoing ?? false,
          titleAr: dto.titleAr.trim(),
          titleEn: dto.titleEn?.trim(),
          summaryAr: dto.summaryAr.trim(),
          summaryEn: dto.summaryEn?.trim(),
          targetAmount: dto.targetAmount,
          currency: dto.currency,
          priority: dto.priority,
          coverKey: dto.coverKey,
          area: dto.area?.trim(),
          status: publish ? 'ACTIVE' : 'DRAFT',
          publishedAt: publish ? new Date() : null,
          createdById: actor.id,
        },
        select: { id: true, slug: true, status: true },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'campaign.create',
          entityType: 'Campaign',
          entityId: campaign.id,
          after: { slug: campaign.slug, category: category.code, status: campaign.status },
        },
        tx,
      );
      return campaign;
    });
    // Published now (not a draft): urgent campaigns alert the opted-in donors.
    if (publish) await this.notifications.campaignPublished(created.id);
    return created;
  }

  /**
   * Campaign lifecycle (ADMIN; CASE_OFFICER for campaigns from the medical case pipeline): publish a
   * draft, pause / resume new pledges, mark it completed («تم الإنجاز») or close it. Rules in
   * `lifecycleProblem`; pledges already made keep their path to verification.
   */
  async updateStatus(id: string, dto: UpdateCampaignStatusDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'CASE_OFFICER']);
    if (dto.status === undefined && dto.acceptsPledges === undefined) {
      throw new BadRequestException('nothing_to_change');
    }
    const actorId = actor.id;
    let firstPublish = false;
    const updated = await this.prisma.$transaction(async (tx) => {
      const before = await tx.campaign.findUnique({
        where: { id },
        include: { case: { select: { status: true } } },
      });
      if (!before) throw new NotFoundException('campaign_not_found');
      assertCanManage(before, actor);
      const status = dto.status ?? before.status;
      const openPledges =
        status === 'CLOSED'
          ? await tx.pledge.count({
              where: { campaignId: id, status: { in: [...OPEN_PLEDGE_STATUSES] } },
            })
          : 0;
      const problem = lifecycleProblem({
        from: before.status,
        to: status,
        publishedAt: before.publishedAt,
        resume: dto.acceptsPledges === true,
        caseStatus: before.case?.status ?? null,
        verifiedAmount: before.verifiedAmount,
        openPledges,
      });
      if (problem) throw new ConflictException(problem);
      const ends = status === 'COMPLETED' || status === 'CLOSED';
      const after = await tx.campaign.update({
        where: { id },
        data: {
          status,
          ...(dto.acceptsPledges === undefined ? {} : { acceptsPledges: dto.acceptsPledges }),
          // «تم الإنجاز» or closed by the council: no more pledges.
          ...(ends ? { acceptsPledges: false } : {}),
          ...(status === 'ACTIVE' && !before.publishedAt ? { publishedAt: new Date() } : {}),
        },
      });
      firstPublish = status === 'ACTIVE' && !before.publishedAt;
      if (ends && before.caseId) {
        await tx.case.update({ where: { id: before.caseId }, data: { status: 'CLOSED' } });
      }
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
    // A draft going public for the first time: urgent campaigns alert the opted-in donors.
    if (firstPublish) await this.notifications.campaignPublished(id);
    return updated;
  }

  /**
   * Edits the public presentation: titles, anonymised summaries, cover illustration, area, priority.
   * Money, category, hospital and status never change here. A closed campaign is read-only.
   */
  async update(id: string, dto: UpdateCampaignDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'CASE_OFFICER']);
    const before = await this.prisma.campaign.findUnique({
      where: { id },
      select: { ...EDITABLE_SELECT, caseId: true, status: true },
    });
    if (!before) throw new NotFoundException('campaign_not_found');
    assertCanManage(before, actor);
    if (before.status === 'CLOSED') throw new ConflictException('campaign_closed');
    const data = {
      titleAr: dto.titleAr?.trim(),
      titleEn: clearable(dto.titleEn),
      summaryAr: dto.summaryAr?.trim(),
      summaryEn: clearable(dto.summaryEn),
      coverKey: dto.coverKey,
      area: clearable(dto.area),
      priority: dto.priority,
    };
    const changed = (Object.keys(data) as (keyof typeof data)[]).filter(
      (k) => data[k] !== undefined && data[k] !== before[k],
    );
    if (changed.length === 0) throw new BadRequestException('campaign_unchanged');
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.campaign.update({
        where: { id },
        data,
        select: { id: true, slug: true, ...EDITABLE_SELECT },
      });
      // Public texts only (the summaries are anonymised): safe to keep in the audit row.
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'campaign.update',
          entityType: 'Campaign',
          entityId: id,
          before: Object.fromEntries(changed.map((k) => [k, before[k]])),
          after: Object.fromEntries(changed.map((k) => [k, after[k]])),
        },
        tx,
      );
      return after;
    });
  }

  /** Posts a public update on the campaign page (e.g. "the roof is done"). Audited. */
  async addUpdate(campaignId: string, dto: CreateCampaignUpdateDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['STAFF', 'CASE_OFFICER', 'ADMIN']);
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    if (campaign.status === 'CLOSED') throw new ConflictException('campaign_closed');
    return this.prisma.$transaction(async (tx) => {
      const update = await tx.campaignUpdate.create({
        data: {
          campaignId,
          authorId: actor.id,
          bodyAr: dto.bodyAr.trim(),
          bodyEn: dto.bodyEn?.trim() || null,
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'campaign.post_update',
          entityType: 'Campaign',
          entityId: campaignId,
          after: { updateId: update.id },
        },
        tx,
      );
      return update;
    });
  }

  /** One campaign for its management page (ADMIN; CASE_OFFICER for medical-case campaigns). */
  async getForStaff(id: string, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'CASE_OFFICER']);
    const row = await this.prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        caseId: true,
        ...EDITABLE_SELECT,
        status: true,
        acceptsPledges: true,
        isOngoing: true,
        currency: true,
        targetAmount: true,
        verifiedAmount: true,
        spentAmount: true,
        publishedAt: true,
        category: { select: { id: true, code: true, nameAr: true, nameEn: true, icon: true } },
        hospital: { select: { id: true, nameAr: true } },
        case: { select: { id: true, trackingNo: true, status: true } },
        updates: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            bodyAr: true,
            bodyEn: true,
            createdAt: true,
            author: { select: { fullName: true } },
          },
        },
        ...activeBeneficiariesCount,
      },
    });
    if (!row) throw new NotFoundException('campaign_not_found');
    assertCanManage(row, actor);
    const openPledges = await this.prisma.pledge.count({
      where: { campaignId: id, status: { in: [...OPEN_PLEDGE_STATUSES] } },
    });
    return { ...row, openPledges };
  }

  /** Staff dashboards: every campaign with its status and category. */
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
        category: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            icon: true,
            // The registry's link form offers a beneficiary only campaigns of its kind.
            requiresMedicalCase: true,
            supportsMonthlySponsorship: true,
            beneficiaryKind: true,
          },
        },
        hospital: { select: { id: true, nameAr: true } },
        ...activeBeneficiariesCount,
      },
    });
  }
}

/** CASE_OFFICER manages only campaigns that come from the medical case pipeline. */
function assertCanManage(campaign: { caseId: string | null }, actor: AuthenticatedUser): void {
  if (actor.role === 'CASE_OFFICER' && !campaign.caseId) {
    throw new ForbiddenException('role_not_allowed');
  }
}

/** An optional text field: undefined = unchanged, '' = cleared (null). */
function clearable(value: string | undefined): string | null | undefined {
  return value === undefined ? undefined : value.trim() || null;
}

/**
 * Builds the public campaign field by field from a row that only selects public-safe relations
 * (category, hospital, case summary flags, beneficiary counts). Never spreads the row.
 */
export function toPublicCampaign(
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
    isGeneralFund: row.isGeneralFund,
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
    beneficiariesCount: row._count.beneficiaries,
  };
}
