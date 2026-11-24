import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CampaignStats {
  /** تعهدات بإيصال مرفوع أو حصيلة نقطة جمع، بانتظار التحقق. */
  pending: Prisma.Decimal;
  /** Simulated payments (DEMO_MODE only): reported separately, never added to verified money. */
  demo: Prisma.Decimal;
  donorsCount: number;
}

/** يحسب «بانتظار التحقق» وعدد المتبرعين بـaggregate (المتحقق مخزّن في Campaign). */
@Injectable()
export class CampaignStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  get demoMode(): boolean {
    return this.config.get<string>('DEMO_MODE') === 'true';
  }

  async forCampaigns(campaignIds: string[]): Promise<Map<string, CampaignStats>> {
    const result = new Map<string, CampaignStats>();
    for (const id of campaignIds) {
      result.set(id, {
        pending: new Prisma.Decimal(0),
        demo: new Prisma.Decimal(0),
        donorsCount: 0,
      });
    }
    if (campaignIds.length === 0) return result;

    const groups = await this.prisma.pledge.groupBy({
      by: ['campaignId', 'status', 'isDemo'],
      where: {
        campaignId: { in: campaignIds },
        status: { in: ['RECEIPT_UPLOADED', 'COLLECTED', 'VERIFIED', 'DEMO_CONFIRMED'] },
      },
      _sum: { amount: true, fundAmount: true, heldAmount: true },
      _count: { _all: true },
    });

    for (const g of groups) {
      const stats = result.get(g.campaignId);
      if (!stats) continue;
      // Only the campaign share: a surplus share belongs to the general fund (docs/fund-contract.md).
      const zero = new Prisma.Decimal(0);
      const sum = (g._sum.amount ?? zero)
        .minus(g._sum.fundAmount ?? zero)
        .minus(g._sum.heldAmount ?? zero);
      if (g.isDemo) {
        if (this.demoMode && g.status === 'DEMO_CONFIRMED') {
          stats.demo = stats.demo.plus(sum);
          stats.donorsCount += g._count._all;
        }
      } else if (g.status === 'VERIFIED') {
        stats.donorsCount += g._count._all;
      } else {
        stats.pending = stats.pending.plus(sum);
      }
    }
    await this.addFundShares(campaignIds, result);
    return result;
  }

  /** The general fund's pending and demo money also include the fund shares of other campaigns' pledges. */
  private async addFundShares(campaignIds: string[], result: Map<string, CampaignStats>) {
    const fund = await this.prisma.campaign.findFirst({
      where: { isGeneralFund: true, id: { in: campaignIds } },
      select: { id: true },
    });
    const stats = fund && result.get(fund.id);
    if (!fund || !stats) return;
    const groups = await this.prisma.pledge.groupBy({
      by: ['status', 'isDemo'],
      where: {
        campaignId: { not: fund.id },
        fundAmount: { gt: 0 },
        status: { in: ['RECEIPT_UPLOADED', 'COLLECTED', 'DEMO_CONFIRMED'] },
      },
      _sum: { fundAmount: true },
    });
    for (const g of groups) {
      const sum = g._sum.fundAmount ?? new Prisma.Decimal(0);
      if (g.isDemo) {
        if (this.demoMode && g.status === 'DEMO_CONFIRMED') stats.demo = stats.demo.plus(sum);
      } else stats.pending = stats.pending.plus(sum);
    }
  }
}
