import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CampaignStats {
  /** تعهدات بإيصال مرفوع أو حصيلة نقطة جمع، بانتظار التحقق. */
  pending: Prisma.Decimal;
  /** مبالغ المحاكاة (تُضاف للمتحقق فقط عند DEMO_MODE). */
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
      _sum: { amount: true },
      _count: { _all: true },
    });

    for (const g of groups) {
      const stats = result.get(g.campaignId);
      if (!stats) continue;
      const sum = g._sum.amount ?? new Prisma.Decimal(0);
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
    return result;
  }
}
