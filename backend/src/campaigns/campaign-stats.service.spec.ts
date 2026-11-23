import type { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { CampaignStatsService } from './campaign-stats.service';

const CAMPAIGN = '22222222-2222-2222-2222-222222222222';
const d = (n: number) => new Prisma.Decimal(n);

function statsWith(groups: unknown[], demoMode = 'true') {
  const prisma = { pledge: { groupBy: jest.fn().mockResolvedValue(groups) } };
  const config = { get: () => demoMode } as unknown as ConfigService;
  return new CampaignStatsService(prisma as unknown as PrismaService, config);
}

describe('CampaignStatsService keeps demo money apart', () => {
  const groups = [
    {
      campaignId: CAMPAIGN,
      status: 'DEMO_CONFIRMED',
      isDemo: true,
      _sum: { amount: d(400_000) },
      _count: { _all: 2 },
    },
    {
      campaignId: CAMPAIGN,
      status: 'RECEIPT_UPLOADED',
      isDemo: false,
      _sum: { amount: d(250_000) },
      _count: { _all: 1 },
    },
    {
      campaignId: CAMPAIGN,
      status: 'COLLECTED',
      isDemo: false,
      _sum: { amount: d(100_000) },
      _count: { _all: 1 },
    },
    {
      campaignId: CAMPAIGN,
      status: 'VERIFIED',
      isDemo: false,
      _sum: { amount: d(3_000_000) },
      _count: { _all: 3 },
    },
  ];

  it('reports demo payments only as demo, never as pending or verified', async () => {
    const stats = (await statsWith(groups).forCampaigns([CAMPAIGN])).get(CAMPAIGN);
    expect(stats?.demo.toString()).toBe('400000');
    // pending = receipt uploaded + collected cash; the demo 400,000 is not in it.
    expect(stats?.pending.toString()).toBe('350000');
  });

  it('hides demo money entirely when DEMO_MODE is off', async () => {
    const stats = (await statsWith(groups, 'false').forCampaigns([CAMPAIGN])).get(CAMPAIGN);
    expect(stats?.demo.toString()).toBe('0');
    expect(stats?.pending.toString()).toBe('350000');
    expect(stats?.donorsCount).toBe(3);
  });
});
