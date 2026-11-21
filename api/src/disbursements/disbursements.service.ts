import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { money, toDecimal } from '../common/utils/money';
import type { AuthUser } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateDisbursementDto } from './disbursements.dto';

@Injectable()
export class DisbursementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /**
   * FR-21: الصرف للمشفى المعتمد فقط، مع فاتورة، ولا يتجاوز الرصيد المتحقق.
   * المشفى يُؤخذ من الاعتماد نفسه — لا يُمرَّر من المستخدم (يمنع سيناريو 15 ← 25 مليون).
   */
  async create(
    dto: CreateDisbursementDto,
    file: Express.Multer.File | undefined,
    actor: AuthUser,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
      include: { case: true },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    if (!campaign.hospitalId) throw new ConflictException('no_approved_hospital');
    if (campaign.case && !['PUBLISHED', 'APPROVED'].includes(campaign.case.status)) {
      throw new ConflictException('case_under_review');
    }
    const amount = toDecimal(dto.amount);
    const available = campaign.verifiedAmount.minus(campaign.disbursedAmount);
    if (amount.greaterThan(available))
      throw new BadRequestException('amount_exceeds_verified_balance');

    const stored = await this.storage.save(file, 'invoices');
    const hospitalId = campaign.hospitalId;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.document.create({
        data: {
          kind: 'HOSPITAL_INVOICE',
          caseId: campaign.caseId,
          storageKey: stored.storageKey,
          originalName: file?.originalname ?? 'invoice',
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          sha256: stored.sha256,
          uploadedById: actor.id,
        },
      });
      const disbursement = await tx.disbursement.create({
        data: {
          campaignId: campaign.id,
          hospitalId,
          amount,
          currency: campaign.currency,
          invoiceDocumentId: invoice.id,
          note: dto.note,
          paidAt: new Date(dto.paidAt),
          recordedById: actor.id,
        },
      });
      const updated = await tx.campaign.update({
        where: { id: campaign.id },
        data: { disbursedAmount: { increment: amount } },
      });
      if (updated.disbursedAmount.greaterThanOrEqualTo(updated.targetAmount)) {
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
          action: 'disbursement.create',
          entityType: 'Campaign',
          entityId: campaign.id,
          after: {
            disbursementId: disbursement.id,
            amount: money(amount),
            hospitalId,
            disbursedTotal: money(updated.disbursedAmount),
          },
        },
        tx,
      );
      return {
        id: disbursement.id,
        amount: money(amount),
        hospitalId,
        campaignDisbursed: money(updated.disbursedAmount),
      };
    });
  }

  async listForCampaign(campaignId: string) {
    const rows = await this.prisma.disbursement.findMany({
      where: { campaignId },
      orderBy: { paidAt: 'desc' },
      include: {
        hospital: { select: { nameAr: true } },
        recordedBy: { select: { fullName: true } },
      },
    });
    return rows.map((d) => ({
      id: d.id,
      amount: money(d.amount),
      currency: d.currency,
      paidAt: d.paidAt.toISOString(),
      hospital: d.hospital.nameAr,
      recordedBy: d.recordedBy.fullName,
      invoiceDocumentId: d.invoiceDocumentId,
      note: d.note,
    }));
  }
}
