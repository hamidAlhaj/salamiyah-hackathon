import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PublicExpenditure } from '../common/shared';
import { money, toDecimal } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateExpenditureDto, MonthlyRunDto } from './expenditures.dto';

/** Campaigns that can still spend; COMPLETED / CLOSED / DRAFT cannot. */
const SPENDABLE = ['ACTIVE', 'FUNDED'] as const;
/** Public statuses: the spending timeline and public proofs are shown only for these. */
const PUBLIC = ['ACTIVE', 'FUNDED', 'COMPLETED'] as const;
const STAFF_READERS = ['FINANCE_VERIFIER', 'ADMIN', 'CASE_OFFICER'] as const;

type CampaignForSpend = Prisma.CampaignGetPayload<{
  include: { case: true; category: true; hospital: { select: { nameAr: true } } };
}>;

/**
 * Spending from a campaign («المبالغ التي تم صرفها»). Rules read the campaign category's behaviour
 * flags, never its code: lockedPayeeHospital forces the approved hospital; supportsMonthlySponsorship
 * enables the monthly run. Every amount is limited to remaining = verified − spent. Proofs go through
 * StorageService (magic bytes, EXIF strip) and are public only when marked so at upload.
 */
@Injectable()
export class ExpendituresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  private async spendableCampaign(campaignId: string): Promise<CampaignForSpend> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { case: true, category: true, hospital: { select: { nameAr: true } } },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    if (!(SPENDABLE as readonly string[]).includes(campaign.status)) {
      throw new ConflictException('campaign_not_spendable');
    }
    return campaign;
  }

  async create(
    dto: CreateExpenditureDto,
    file: Express.Multer.File | undefined,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['FINANCE_VERIFIER']);
    const campaign = await this.spendableCampaign(dto.campaignId);

    // lockedPayeeHospital: the payee is always the approved hospital, never chosen by the user
    // (prevents the "15 → 25 million, another hospital" scenario).
    let hospitalId: string | null = null;
    let payeeLabel = dto.payeeLabel?.trim() ?? '';
    if (campaign.category.lockedPayeeHospital) {
      if (dto.payeeType !== 'HOSPITAL')
        throw new ConflictException('payee_must_be_locked_hospital');
      if (!campaign.hospitalId) throw new ConflictException('no_approved_hospital');
      if (campaign.case && !['PUBLISHED', 'APPROVED'].includes(campaign.case.status)) {
        throw new ConflictException('case_under_review');
      }
      hospitalId = campaign.hospitalId;
      payeeLabel = campaign.hospital?.nameAr ?? payeeLabel;
    } else if (payeeLabel.length < 2) {
      throw new BadRequestException('payee_label_required');
    }

    // BENEFICIARY_FAMILY: only a beneficiary linked to this campaign (shown publicly by code only).
    let beneficiaryId: string | null = null;
    if (dto.payeeType === 'BENEFICIARY_FAMILY') {
      if (!dto.beneficiaryId) throw new BadRequestException('beneficiary_required');
      const link = await this.prisma.campaignBeneficiary.findUnique({
        where: {
          campaignId_beneficiaryId: {
            campaignId: campaign.id,
            beneficiaryId: dto.beneficiaryId,
          },
        },
        select: { id: true },
      });
      if (!link) throw new ConflictException('beneficiary_not_linked');
      beneficiaryId = dto.beneficiaryId;
    }

    const amount = toDecimal(dto.amount);
    const remaining = campaign.verifiedAmount.minus(campaign.spentAmount);
    if (amount.greaterThan(remaining))
      throw new ConflictException('amount_exceeds_remaining_balance');

    const stored = await this.storage.save(file, 'expenditures');

    return this.prisma.$transaction(async (tx) => {
      const proof = await tx.document.create({
        data: {
          kind: 'EXPENDITURE_PROOF',
          caseId: campaign.caseId,
          storageKey: stored.storageKey,
          originalName: file?.originalname ?? 'proof',
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          sha256: stored.sha256,
          uploadedById: actor.id,
        },
      });
      const expenditure = await tx.expenditure.create({
        data: {
          campaignId: campaign.id,
          payeeType: dto.payeeType,
          payeeLabel,
          hospitalId,
          beneficiaryId,
          amount,
          currency: campaign.currency,
          description: dto.description.trim(),
          descriptionEn: dto.descriptionEn?.trim() || null,
          paidAt: new Date(dto.paidAt),
          proofDocumentId: proof.id,
          proofPublic: dto.proofPublic === true,
          recordedById: actor.id,
        },
      });
      const after = await this.addSpent(tx, campaign, amount);
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'expenditure.create',
          entityType: 'Campaign',
          entityId: campaign.id,
          after: {
            expenditureId: expenditure.id,
            payeeType: dto.payeeType,
            amount: money(amount),
            hospitalId,
            proofPublic: expenditure.proofPublic,
            spentTotal: money(after.spentAmount),
            status: after.status,
          },
        },
        tx,
      );
      return {
        id: expenditure.id,
        amount: money(amount),
        payeeType: expenditure.payeeType,
        hospitalId,
        campaignSpent: money(after.spentAmount),
        campaignStatus: after.status,
      };
    });
  }

  /**
   * «ادفع كفالة هذا الشهر»: one BENEFICIARY_FAMILY expenditure per active sponsored beneficiary at
   * their monthlyAmount, all in one transaction. Refused when the category does not support monthly
   * sponsorship, when any beneficiary is already paid for that month, or when the balance cannot
   * cover them all. A unique index (campaign, beneficiary, month) guards against double runs too.
   */
  async payMonth(
    campaignId: string,
    dto: MonthlyRunDto,
    file: Express.Multer.File | undefined,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['FINANCE_VERIFIER']);
    const campaign = await this.spendableCampaign(campaignId);
    if (!campaign.category.supportsMonthlySponsorship) {
      throw new ConflictException('monthly_sponsorship_not_supported');
    }
    const links = await this.prisma.campaignBeneficiary.findMany({
      where: { campaignId, endedAt: null, monthlyAmount: { not: null } },
      include: { beneficiary: { select: { id: true, publicCode: true, isSuspended: true } } },
      orderBy: { startedAt: 'asc' },
    });
    const active = links.filter((l) => !l.beneficiary.isSuspended);
    if (active.length === 0) throw new ConflictException('no_sponsored_beneficiaries');

    const alreadyPaid = await this.prisma.expenditure.findMany({
      where: {
        campaignId,
        periodMonth: dto.periodMonth,
        beneficiaryId: { in: active.map((l) => l.beneficiaryId) },
      },
      select: { beneficiaryId: true },
    });
    if (alreadyPaid.length > 0) throw new ConflictException('month_already_paid');

    const total = active.reduce((sum, l) => sum.plus(l.monthlyAmount ?? 0), toDecimal('0'));
    const remaining = campaign.verifiedAmount.minus(campaign.spentAmount);
    if (total.greaterThan(remaining))
      throw new ConflictException('amount_exceeds_remaining_balance');

    const stored = file ? await this.storage.save(file, 'expenditures') : null;
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const proof = stored
        ? await tx.document.create({
            data: {
              kind: 'EXPENDITURE_PROOF',
              storageKey: stored.storageKey,
              originalName: file?.originalname ?? 'proof',
              mimeType: stored.mimeType,
              sizeBytes: stored.sizeBytes,
              sha256: stored.sha256,
              uploadedById: actor.id,
            },
          })
        : null;
      await tx.expenditure.createMany({
        data: active.map((l) => ({
          campaignId,
          payeeType: 'BENEFICIARY_FAMILY' as const,
          // Public-safe: the beneficiary's code, never a name.
          payeeLabel: l.beneficiary.publicCode,
          beneficiaryId: l.beneficiaryId,
          amount: l.monthlyAmount ?? toDecimal('0'),
          currency: campaign.currency,
          description: `كفالة شهر ${dto.periodMonth}`,
          descriptionEn: `Sponsorship for ${dto.periodMonth}`,
          paidAt,
          periodMonth: dto.periodMonth,
          proofDocumentId: proof?.id ?? null,
          proofPublic: proof !== null && dto.proofPublic === true,
          recordedById: actor.id,
        })),
      });
      const after = await this.addSpent(tx, campaign, total);
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'expenditure.monthly',
          entityType: 'Campaign',
          entityId: campaignId,
          after: {
            periodMonth: dto.periodMonth,
            rows: active.length,
            total: money(total),
            spentTotal: money(after.spentAmount),
          },
        },
        tx,
      );
      return {
        periodMonth: dto.periodMonth,
        count: active.length,
        total: money(total),
        codes: active.map((l) => l.beneficiary.publicCode),
        campaignSpent: money(after.spentAmount),
        campaignStatus: after.status,
      };
    });
  }

  /**
   * spentAmount += amount; then «تم الإنجاز»: a campaign that is not an ongoing programme becomes
   * COMPLETED (no more pledges) once spent reaches its target, and a medical case is CLOSED. Ongoing
   * programmes are completed by the council by hand (PATCH /campaigns/:id/status).
   */
  private async addSpent(
    tx: Prisma.TransactionClient,
    campaign: CampaignForSpend,
    amount: Prisma.Decimal,
  ) {
    const updated = await tx.campaign.update({
      where: { id: campaign.id },
      data: { spentAmount: { increment: amount } },
    });
    if (
      !campaign.isOngoing &&
      updated.spentAmount.greaterThanOrEqualTo(updated.targetAmount)
    ) {
      const completed = await tx.campaign.update({
        where: { id: campaign.id },
        data: { status: 'COMPLETED', acceptsPledges: false },
      });
      if (campaign.caseId) {
        await tx.case.update({ where: { id: campaign.caseId }, data: { status: 'CLOSED' } });
      }
      return completed;
    }
    return updated;
  }

  /** Everything the staff spending page needs: flags, hospital, balance, sponsored beneficiaries. */
  async spendingContext(campaignId: string, actor: AuthenticatedUser) {
    this.access.requireRole(actor, [...STAFF_READERS]);
    const c = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        category: true,
        hospital: { select: { id: true, nameAr: true } },
        beneficiaries: {
          where: { endedAt: null },
          include: { beneficiary: { select: { id: true, publicCode: true, kind: true } } },
          orderBy: { startedAt: 'asc' },
        },
      },
    });
    if (!c) throw new NotFoundException('campaign_not_found');
    const months = await this.prisma.expenditure.groupBy({
      by: ['periodMonth'],
      where: { campaignId, periodMonth: { not: null } },
      _count: { _all: true },
    });
    return {
      campaign: {
        id: c.id,
        slug: c.slug,
        title: c.titleAr,
        status: c.status,
        isOngoing: c.isOngoing,
        currency: c.currency,
        targetAmount: money(c.targetAmount),
        verifiedAmount: money(c.verifiedAmount),
        spentAmount: money(c.spentAmount),
        remainingAmount: money(c.verifiedAmount.minus(c.spentAmount)),
        category: {
          code: c.category.code,
          name: c.category.nameAr,
          icon: c.category.icon,
          lockedPayeeHospital: c.category.lockedPayeeHospital,
          supportsMonthlySponsorship: c.category.supportsMonthlySponsorship,
        },
      },
      hospital: c.hospital ? { id: c.hospital.id, name: c.hospital.nameAr } : null,
      beneficiaries: c.beneficiaries.map((b) => ({
        id: b.beneficiary.id,
        code: b.beneficiary.publicCode,
        kind: b.beneficiary.kind,
        monthlyAmount: b.monthlyAmount ? money(b.monthlyAmount) : null,
      })),
      paidMonths: months
        .filter((m) => m.periodMonth)
        .map((m) => ({ periodMonth: m.periodMonth as string, count: m._count._all }))
        .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth)),
    };
  }

  async listForCampaign(campaignId: string, actor: AuthenticatedUser) {
    this.access.requireRole(actor, [...STAFF_READERS]);
    const rows = await this.prisma.expenditure.findMany({
      where: { campaignId },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        hospital: { select: { nameAr: true } },
        beneficiary: { select: { publicCode: true } },
        recordedBy: { select: { fullName: true } },
        proofDocument: { select: { mimeType: true } },
      },
    });
    return rows.map((e) => ({
      id: e.id,
      payeeType: e.payeeType,
      payee: e.payeeLabel,
      hospital: e.hospital?.nameAr ?? null,
      beneficiaryCode: e.beneficiary?.publicCode ?? null,
      amount: money(e.amount),
      currency: e.currency,
      paidAt: e.paidAt.toISOString(),
      periodMonth: e.periodMonth,
      description: e.description,
      descriptionEn: e.descriptionEn,
      recordedBy: e.recordedBy.fullName,
      proofDocumentId: e.proofDocumentId,
      proofMimeType: e.proofDocument?.mimeType ?? null,
      proofPublic: e.proofPublic,
    }));
  }

  /**
   * Public spending timeline of a public campaign. A beneficiary payment shows the beneficiary's
   * code only (never the free-text label); a hospital shows its approved name.
   */
  async publicTimeline(campaignId: string, lang: 'ar' | 'en'): Promise<PublicExpenditure[]> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, status: { in: [...PUBLIC] } },
      select: { id: true },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    const rows = await this.prisma.expenditure.findMany({
      where: { campaignId },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        hospital: { select: { nameAr: true, nameEn: true } },
        beneficiary: { select: { publicCode: true } },
        proofDocument: { select: { mimeType: true } },
      },
    });
    const en = lang === 'en';
    return rows.map((e) => ({
      id: e.id,
      paidAt: e.paidAt.toISOString(),
      payeeType: e.payeeType,
      payeeLabel:
        e.payeeType === 'BENEFICIARY_FAMILY'
          ? null
          : e.hospital
            ? ((en ? e.hospital.nameEn : null) ?? e.hospital.nameAr)
            : e.payeeLabel,
      beneficiaryCode: e.beneficiary?.publicCode ?? null,
      amount: money(e.amount),
      currency: e.currency,
      description: (en ? e.descriptionEn : null) ?? e.description,
      periodMonth: e.periodMonth,
      proof: e.proofPublic && e.proofDocument ? { mimeType: e.proofDocument.mimeType } : null,
    }));
  }

  /** The proof file of an expenditure, only if it was published and the campaign is public. */
  async publicProof(expenditureId: string): Promise<{ data: Buffer; mimeType: string }> {
    const e = await this.prisma.expenditure.findFirst({
      where: {
        id: expenditureId,
        proofPublic: true,
        proofDocumentId: { not: null },
        campaign: { status: { in: [...PUBLIC] } },
      },
      include: { proofDocument: { select: { storageKey: true, mimeType: true } } },
    });
    // Not published, unknown, or the campaign is not public: always the same 404.
    if (!e?.proofDocument) throw new NotFoundException('proof_not_found');
    return {
      data: await this.storage.read(e.proofDocument.storageKey),
      mimeType: e.proofDocument.mimeType,
    };
  }
}
