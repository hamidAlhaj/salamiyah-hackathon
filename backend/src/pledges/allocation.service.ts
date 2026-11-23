import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AllocationPreview, SurplusChoice } from '../common/shared';
import { money } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import {
  type PledgePlan,
  planPledge,
  quote,
  remainingNeed,
  RESERVE_HOURS,
} from './allocation';

type Db = PrismaService | Prisma.TransactionClient;

/** Reads the numbers the allocation rules need (docs/fund-contract.md). */
@Injectable()
export class AllocationService {
  constructor(private readonly prisma: PrismaService) {}

  /** The general council fund (one campaign), or null when it is not seeded. */
  fund(db: Db = this.prisma) {
    return db.campaign.findFirst({
      where: { isGeneralFund: true },
      select: { id: true, slug: true, titleAr: true, titleEn: true },
    });
  }

  /**
   * Campaign shares already promised: receipts uploaded, cash collected, and unpaid transfer pledges of
   * the last RESERVE_HOURS. Demo pledges never reserve.
   */
  async reserved(db: Db, campaignId: string, now = new Date()): Promise<Prisma.Decimal> {
    const since = new Date(now.getTime() - RESERVE_HOURS * 3_600_000);
    const sums = await db.pledge.aggregate({
      where: {
        campaignId,
        isDemo: false,
        OR: [
          { status: { in: ['RECEIPT_UPLOADED', 'COLLECTED'] } },
          { status: 'PLEDGED', createdAt: { gte: since } },
        ],
      },
      _sum: { amount: true, fundAmount: true, heldAmount: true },
    });
    const zero = new Prisma.Decimal(0);
    return (sums._sum.amount ?? zero)
      .minus(sums._sum.fundAmount ?? zero)
      .minus(sums._sum.heldAmount ?? zero);
  }

  /** null = uncapped (the fund and ongoing programmes). */
  private async remaining(db: Db, campaignId: string) {
    const c = await db.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        currency: true,
        isGeneralFund: true,
        isOngoing: true,
        targetAmount: true,
        verifiedAmount: true,
      },
    });
    if (!c) throw new NotFoundException('campaign_not_found');
    const capped = !c.isGeneralFund && !c.isOngoing;
    const remaining = capped
      ? remainingNeed(c.targetAmount, c.verifiedAmount, await this.reserved(db, campaignId))
      : null;
    return { campaign: c, capped, remaining };
  }

  async preview(
    campaignId: string,
    amount: string,
    lang: 'ar' | 'en',
  ): Promise<AllocationPreview> {
    const { campaign, capped, remaining } = await this.remaining(this.prisma, campaignId);
    const offered = new Prisma.Decimal(amount);
    const q = quote(offered, remaining);
    const fund = campaign.isGeneralFund ? null : await this.fund();
    return {
      campaignId,
      currency: campaign.currency,
      capped,
      offered: money(offered),
      remaining: remaining ? money(remaining) : null,
      campaignShare: money(q.campaignShare),
      surplus: money(q.surplus),
      state: q.state,
      fund: fund
        ? {
            id: fund.id,
            slug: fund.slug,
            title: (lang === 'en' && fund.titleEn) || fund.titleAr,
          }
        : null,
    };
  }

  /**
   * Inside the pledge transaction: locks the campaign row (concurrent final donations queue up), then
   * applies the donor's choice. Conflicts are returned to the client as stable codes.
   */
  async planInTx(
    tx: Prisma.TransactionClient,
    campaignId: string,
    amount: string,
    choice?: SurplusChoice,
    expectedCampaignShare?: string,
  ): Promise<PledgePlan> {
    await tx.$queryRaw`SELECT id FROM campaigns WHERE id = ${campaignId}::uuid FOR UPDATE`;
    const { remaining } = await this.remaining(tx, campaignId);
    const plan = planPledge(
      new Prisma.Decimal(amount),
      remaining,
      choice,
      expectedCampaignShare,
    );
    if (typeof plan === 'string') throw new ConflictException(plan);
    return plan;
  }
}
