import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PublicBeneficiary } from '../common/shared';
import { allocateBeneficiaryCodes } from '../common/utils/beneficiary-codes';
import { money, toDecimal } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BeneficiaryReasonDto,
  CreateBeneficiaryDto,
  CreateBeneficiaryNoteDto,
  LinkBeneficiaryDto,
  UpdateBeneficiaryDto,
  UpdateBeneficiaryLinkDto,
} from './beneficiaries.dto';

const PUBLIC_STATUSES = ['ACTIVE', 'FUNDED', 'COMPLETED'] as const;

/**
 * The ONLY beneficiary fields a public response may read. Identity fields (name, phone, national ID,
 * council, other programmes) are never selected here; the spec asserts it.
 */
export const PUBLIC_BENEFICIARY_SELECT = {
  publicCode: true,
  kind: true,
  area: true,
} satisfies Prisma.BeneficiarySelect;

/**
 * Staff view (ADMIN, STAFF): includes the private name, never the national ID hash. The suspension
 * state is not in it: intake staff must not learn about a suspension (FR-25).
 */
const staffSelect = {
  id: true,
  publicCode: true,
  kind: true,
  area: true,
  fullName: true,
  phone: true,
  createdAt: true,
  _count: { select: { campaignLinks: true } },
  campaignLinks: {
    where: { endedAt: null },
    orderBy: { startedAt: 'asc' },
    select: {
      monthlyAmount: true,
      startedAt: true,
      campaign: { select: { id: true, slug: true, titleAr: true, titleEn: true } },
    },
  },
} satisfies Prisma.BeneficiarySelect;

/** ADMIN view: the staff view plus the suspension state and the latest entries of the internal log. */
const adminSelect = {
  ...staffSelect,
  isSuspended: true,
  suspensionNote: true,
  notes: {
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      kind: true,
      body: true,
      createdAt: true,
      author: { select: { fullName: true } },
    },
  },
} satisfies Prisma.BeneficiarySelect;

@Injectable()
export class BeneficiariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  list(q: string | undefined, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'STAFF']);
    const term = q?.trim();
    const args = {
      where: term
        ? {
            OR: [
              { publicCode: { contains: term.toUpperCase() } },
              { fullName: { contains: term, mode: 'insensitive' } },
              { area: { contains: term, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    } satisfies Prisma.BeneficiaryFindManyArgs;
    return actor.role === 'ADMIN'
      ? this.prisma.beneficiary.findMany({ ...args, select: adminSelect })
      : this.prisma.beneficiary.findMany({ ...args, select: staffSelect });
  }

  async create(dto: CreateBeneficiaryDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'STAFF']);
    return this.prisma.$transaction(async (tx) => {
      const [publicCode] = await allocateBeneficiaryCodes(tx, 1);
      const beneficiary = await tx.beneficiary.create({
        data: {
          publicCode,
          kind: dto.kind,
          area: dto.area?.trim(),
          fullName: dto.fullName.trim(),
          phone: dto.phone,
        },
        select: staffSelect,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'beneficiary.create',
          entityType: 'Beneficiary',
          entityId: beneficiary.id,
          after: { publicCode, kind: dto.kind },
        },
        tx,
      );
      return beneficiary;
    });
  }

  /**
   * ADMIN links an anonymised beneficiary to a campaign. A monthly amount is only accepted when the
   * campaign's category supports monthly sponsorship (a flag, never the category code).
   */
  async linkToCampaign(campaignId: string, dto: LinkBeneficiaryDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, category: { select: { supportsMonthlySponsorship: true } } },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    if (dto.monthlyAmount && !campaign.category.supportsMonthlySponsorship) {
      throw new ConflictException('monthly_sponsorship_not_supported');
    }
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: dto.beneficiaryId },
      select: { id: true, publicCode: true, isSuspended: true },
    });
    // A suspended beneficiary gets the same generic answer as an unknown one.
    if (!beneficiary || beneficiary.isSuspended)
      throw new NotFoundException('beneficiary_not_found');
    const existing = await this.prisma.campaignBeneficiary.findUnique({
      where: { campaignId_beneficiaryId: { campaignId, beneficiaryId: beneficiary.id } },
      select: { id: true, endedAt: true },
    });
    if (existing && !existing.endedAt)
      throw new ConflictException('beneficiary_already_linked');
    const monthlyAmount = dto.monthlyAmount ? toDecimal(dto.monthlyAmount) : null;

    return this.prisma.$transaction(async (tx) => {
      // An ended link is reopened (one row per campaign and beneficiary).
      const link = existing
        ? await tx.campaignBeneficiary.update({
            where: { id: existing.id },
            data: { monthlyAmount, startedAt: new Date(), endedAt: null },
          })
        : await tx.campaignBeneficiary.create({
            data: { campaignId, beneficiaryId: beneficiary.id, monthlyAmount },
          });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'campaign.beneficiary.link',
          entityType: 'Campaign',
          entityId: campaignId,
          after: {
            beneficiary: beneficiary.publicCode,
            monthlyAmount: dto.monthlyAmount ?? null,
          },
        },
        tx,
      );
      return {
        code: beneficiary.publicCode,
        monthlyAmount: link.monthlyAmount ? money(link.monthlyAmount) : null,
        since: link.startedAt.toISOString(),
      };
    });
  }

  /** ADMIN corrects the private record or the public kind/area; the public code never changes. */
  async update(id: string, dto: UpdateBeneficiaryDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const before = await this.prisma.beneficiary.findUnique({
      where: { id },
      select: { id: true, publicCode: true, kind: true, area: true },
    });
    if (!before) throw new NotFoundException('beneficiary_not_found');
    return this.prisma.$transaction(async (tx) => {
      const beneficiary = await tx.beneficiary.update({
        where: { id },
        data: {
          kind: dto.kind,
          fullName: dto.fullName?.trim(),
          phone: dto.phone,
          area: dto.area === undefined ? undefined : dto.area.trim() || null,
        },
        select: adminSelect,
      });
      // Only public fields in the audit row: the private name and phone stay out of the log.
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'beneficiary.update',
          entityType: 'Beneficiary',
          entityId: id,
          before: { publicCode: before.publicCode, kind: before.kind, area: before.area },
          after: {
            publicCode: beneficiary.publicCode,
            kind: beneficiary.kind,
            area: beneficiary.area,
            privateFieldsChanged: dto.fullName !== undefined || dto.phone !== undefined,
          },
        },
        tx,
      );
      return beneficiary;
    });
  }

  /**
   * ADMIN changes a link's monthly amount (monthly-sponsorship categories only, by flag) or ends it.
   * An ended link leaves the public list and future monthly runs; its paid history stays.
   */
  async updateLink(
    campaignId: string,
    beneficiaryId: string,
    dto: UpdateBeneficiaryLinkDto,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['ADMIN']);
    const link = await this.prisma.campaignBeneficiary.findUnique({
      where: { campaignId_beneficiaryId: { campaignId, beneficiaryId } },
      select: {
        id: true,
        endedAt: true,
        monthlyAmount: true,
        beneficiary: { select: { publicCode: true } },
        campaign: { select: { category: { select: { supportsMonthlySponsorship: true } } } },
      },
    });
    if (!link || link.endedAt) throw new NotFoundException('beneficiary_not_linked');
    if (dto.monthlyAmount && !link.campaign.category.supportsMonthlySponsorship)
      throw new ConflictException('monthly_sponsorship_not_supported');
    if (!dto.monthlyAmount && !dto.end) throw new ConflictException('nothing_to_change');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaignBeneficiary.update({
        where: { id: link.id },
        data: {
          monthlyAmount: dto.monthlyAmount ? toDecimal(dto.monthlyAmount) : undefined,
          endedAt: dto.end ? new Date() : undefined,
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: dto.end ? 'campaign.beneficiary.end' : 'campaign.beneficiary.update',
          entityType: 'Campaign',
          entityId: campaignId,
          before: {
            beneficiary: link.beneficiary.publicCode,
            monthlyAmount: link.monthlyAmount ? money(link.monthlyAmount) : null,
          },
          after: {
            beneficiary: link.beneficiary.publicCode,
            monthlyAmount: updated.monthlyAmount ? money(updated.monthlyAmount) : null,
            ended: Boolean(updated.endedAt),
          },
        },
        tx,
      );
      return {
        code: link.beneficiary.publicCode,
        monthlyAmount: updated.monthlyAmount ? money(updated.monthlyAmount) : null,
        endedAt: updated.endedAt?.toISOString() ?? null,
      };
    });
  }

  /**
   * ADMIN suspends a beneficiary (FR-25): new intake requests for their national ID are refused with
   * the generic `cannot_submit_request`, they cannot be linked to more campaigns and monthly runs skip
   * them. Nothing changes on public pages. The reason goes into the internal log and the audit row.
   */
  suspend(id: string, dto: BeneficiaryReasonDto, actor: AuthenticatedUser) {
    return this.setSuspended(id, true, dto.reason, actor);
  }

  /** ADMIN lifts the suspension: intake and linking work again. The reason is logged too. */
  reactivate(id: string, dto: BeneficiaryReasonDto, actor: AuthenticatedUser) {
    return this.setSuspended(id, false, dto.reason, actor);
  }

  private async setSuspended(
    id: string,
    suspend: boolean,
    reason: string,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['ADMIN']);
    const before = await this.prisma.beneficiary.findUnique({
      where: { id },
      select: { id: true, publicCode: true, isSuspended: true },
    });
    if (!before) throw new NotFoundException('beneficiary_not_found');
    if (before.isSuspended === suspend) {
      throw new ConflictException(
        suspend ? 'beneficiary_already_suspended' : 'beneficiary_not_suspended',
      );
    }
    const text = reason.trim();
    return this.prisma.$transaction(async (tx) => {
      const beneficiary = await tx.beneficiary.update({
        where: { id },
        data: { isSuspended: suspend, suspensionNote: suspend ? text : null },
        select: adminSelect,
      });
      await tx.beneficiaryNote.create({
        data: {
          beneficiaryId: id,
          kind: suspend ? 'SUSPENDED' : 'REACTIVATED',
          body: text,
          authorId: actor.id,
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: suspend ? 'beneficiary.suspend' : 'beneficiary.reactivate',
          entityType: 'Beneficiary',
          entityId: id,
          before: { publicCode: before.publicCode, isSuspended: before.isSuspended },
          after: { publicCode: before.publicCode, isSuspended: suspend, reason: text },
        },
        tx,
      );
      return beneficiary;
    });
  }

  /** ADMIN records a note or a violation in the beneficiary's internal log (never public). */
  async addNote(id: string, dto: CreateBeneficiaryNoteDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const exists = await this.prisma.beneficiary.count({ where: { id } });
    if (!exists) throw new NotFoundException('beneficiary_not_found');
    return this.prisma.$transaction(async (tx) => {
      const note = await tx.beneficiaryNote.create({
        data: { beneficiaryId: id, kind: dto.kind, body: dto.body.trim(), authorId: actor.id },
        select: {
          id: true,
          kind: true,
          body: true,
          createdAt: true,
          author: { select: { fullName: true } },
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'beneficiary.note',
          entityType: 'Beneficiary',
          entityId: id,
          after: { noteId: note.id, kind: note.kind },
        },
        tx,
      );
      return note;
    });
  }

  /** Public: the anonymised beneficiaries of a public campaign (active links only). */
  async publicForCampaign(campaignId: string): Promise<PublicBeneficiary[]> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, status: { in: [...PUBLIC_STATUSES] } },
      select: { id: true },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    const links = await this.prisma.campaignBeneficiary.findMany({
      where: { campaignId, endedAt: null },
      orderBy: { startedAt: 'asc' },
      select: {
        monthlyAmount: true,
        startedAt: true,
        beneficiary: { select: PUBLIC_BENEFICIARY_SELECT },
      },
    });
    return links.map(toPublicBeneficiary);
  }
}

/** Builds the public shape field by field, so an extra field on the row can never leak. */
export function toPublicBeneficiary(link: {
  monthlyAmount: Prisma.Decimal | null;
  startedAt: Date;
  beneficiary: { publicCode: string; kind: PublicBeneficiary['kind']; area: string | null };
}): PublicBeneficiary {
  return {
    code: link.beneficiary.publicCode,
    kind: link.beneficiary.kind,
    area: link.beneficiary.area,
    monthlyAmount: link.monthlyAmount ? money(link.monthlyAmount) : null,
    since: link.startedAt.toISOString(),
  };
}
