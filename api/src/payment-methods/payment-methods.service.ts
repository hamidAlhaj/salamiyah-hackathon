import { Injectable, NotFoundException } from '@nestjs/common';
import type { PaymentMethod } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PaymentAccount } from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';
import { mergePaymentAccounts } from './payment-accounts';
import type { SetCampaignAccountDto } from './payment-methods.dto';

/** Public campaign statuses: receiving details are only shown for these. */
const PUBLIC_STATUSES = ['ACTIVE', 'FUNDED', 'COMPLETED'] as const;

/** The "campaign account" receiving details. All account data is fake for the hackathon. */
@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  private activeConfigs() {
    return this.prisma.paymentMethodConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Public: the default receiving accounts per active method. */
  async listActive(lang: 'ar' | 'en'): Promise<PaymentAccount[]> {
    return mergePaymentAccounts(await this.activeConfigs(), [], lang);
  }

  /** Public: this campaign's receiving accounts (defaults with its overrides applied). */
  async forCampaign(campaignId: string, lang: 'ar' | 'en'): Promise<PaymentAccount[]> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, status: { in: [...PUBLIC_STATUSES] } },
      select: {
        paymentAccounts: {
          select: { method: true, accountName: true, accountNumber: true, note: true },
        },
      },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    return mergePaymentAccounts(await this.activeConfigs(), campaign.paymentAccounts, lang);
  }

  async setCampaignAccount(
    campaignId: string,
    method: PaymentMethod,
    dto: SetCampaignAccountDto,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['ADMIN']);
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.campaignPaymentAccount.upsert({
        where: { campaignId_method: { campaignId, method } },
        create: {
          campaignId,
          method,
          accountName: dto.accountName.trim(),
          accountNumber: dto.accountNumber.trim(),
          note: dto.note?.trim(),
        },
        update: {
          accountName: dto.accountName.trim(),
          accountNumber: dto.accountNumber.trim(),
          note: dto.note?.trim() ?? null,
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'campaign.payment_account.set',
          entityType: 'Campaign',
          entityId: campaignId,
          after: { method, accountNumber: account.accountNumber },
        },
        tx,
      );
      return account;
    });
  }

  async removeCampaignAccount(
    campaignId: string,
    method: PaymentMethod,
    actor: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    this.access.requireRole(actor, ['ADMIN']);
    const existing = await this.prisma.campaignPaymentAccount.findUnique({
      where: { campaignId_method: { campaignId, method } },
    });
    if (!existing) throw new NotFoundException('campaign_account_not_found');
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignPaymentAccount.delete({ where: { id: existing.id } });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'campaign.payment_account.remove',
          entityType: 'Campaign',
          entityId: campaignId,
          before: { method, accountNumber: existing.accountNumber },
        },
        tx,
      );
    });
    return { ok: true };
  }
}
