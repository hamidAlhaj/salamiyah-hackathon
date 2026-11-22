import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { money, toDecimal } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateExpenditureDto } from './expenditures.dto';

/**
 * Spending from a campaign (generalises the old hospital-only payout). Rules read the campaign category's
 * behaviour flags, never its code. Monthly sponsorship runs and the public timeline arrive in P14.
 */
@Injectable()
export class ExpendituresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  async create(
    dto: CreateExpenditureDto,
    file: Express.Multer.File | undefined,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['FINANCE_VERIFIER']);
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
      include: { case: true, category: true },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');

    // lockedPayeeHospital: the payee is always the approved hospital, never chosen by the user
    // (prevents the "15 → 25 million, another hospital" scenario).
    let hospitalId: string | null = null;
    if (campaign.category.lockedPayeeHospital) {
      if (dto.payeeType !== 'HOSPITAL')
        throw new ConflictException('payee_must_be_locked_hospital');
      if (!campaign.hospitalId) throw new ConflictException('no_approved_hospital');
      if (campaign.case && !['PUBLISHED', 'APPROVED'].includes(campaign.case.status)) {
        throw new ConflictException('case_under_review');
      }
      hospitalId = campaign.hospitalId;
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
          payeeLabel: dto.payeeLabel.trim(),
          hospitalId,
          beneficiaryId,
          amount,
          currency: campaign.currency,
          description: dto.description.trim(),
          paidAt: new Date(dto.paidAt),
          proofDocumentId: proof.id,
          recordedById: actor.id,
        },
      });
      const updated = await tx.campaign.update({
        where: { id: campaign.id },
        data: { spentAmount: { increment: amount } },
      });
      if (updated.spentAmount.greaterThanOrEqualTo(updated.targetAmount)) {
        await tx.campaign.update({
          where: { id: campaign.id },
          data: { status: 'COMPLETED', acceptsPledges: false },
        });
        if (campaign.caseId)
          await tx.case.update({ where: { id: campaign.caseId }, data: { status: 'CLOSED' } });
      }
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
            spentTotal: money(updated.spentAmount),
          },
        },
        tx,
      );
      return {
        id: expenditure.id,
        amount: money(amount),
        payeeType: expenditure.payeeType,
        hospitalId,
        campaignSpent: money(updated.spentAmount),
      };
    });
  }

  async listForCampaign(campaignId: string, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['FINANCE_VERIFIER', 'ADMIN', 'CASE_OFFICER']);
    const rows = await this.prisma.expenditure.findMany({
      where: { campaignId },
      orderBy: { paidAt: 'desc' },
      include: {
        hospital: { select: { nameAr: true } },
        beneficiary: { select: { publicCode: true } },
        recordedBy: { select: { fullName: true } },
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
      recordedBy: e.recordedBy.fullName,
      proofDocumentId: e.proofDocumentId,
    }));
  }
}
