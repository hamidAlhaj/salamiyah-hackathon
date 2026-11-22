import { Prisma } from '@prisma/client';
import { findIdentityFields } from '../../test/identity-fields';
import type { CampaignStats, CampaignStatsService } from '../campaigns/campaign-stats.service';
import { computeLedger } from '../campaigns/campaign-ledger';
import type { PrismaService } from '../prisma/prisma.service';
import { StatsService, channelOf, displayNameOf, lastMonths, percent } from './stats.service';

const d = (n: number | string) => new Prisma.Decimal(n);
const NOW = new Date('2026-11-22T10:00:00.000Z');
const CAT_MED = 'cat-med';
const CAT_ORPH = 'cat-orph';
const CAT_HOME = 'cat-home';
const CAT_NEW = 'cat-new';

/** Odd amounts (with cents) so float maths would drift and Decimal maths must not. */
const campaigns = [
  {
    id: 'c1',
    status: 'ACTIVE',
    currency: 'SYP',
    categoryId: CAT_MED,
    targetAmount: d('15000000'),
    verifiedAmount: d('5500000.10'),
    spentAmount: d('1000000.05'),
  },
  {
    id: 'c2',
    status: 'FUNDED',
    currency: 'SYP',
    categoryId: CAT_MED,
    targetAmount: d('2400000'),
    verifiedAmount: d('2400000.20'),
    spentAmount: d('0'),
  },
  {
    id: 'c3',
    status: 'ACTIVE',
    currency: 'SYP',
    categoryId: CAT_ORPH,
    targetAmount: d('9600000'),
    verifiedAmount: d('3000000.30'),
    spentAmount: d('800000'),
  },
  {
    id: 'c4',
    status: 'COMPLETED',
    currency: 'SYP',
    categoryId: CAT_HOME,
    targetAmount: d('750000'),
    verifiedAmount: d('750000'),
    spentAmount: d('750000'),
  },
  {
    id: 'c5',
    status: 'ACTIVE',
    currency: 'USD',
    categoryId: CAT_HOME,
    targetAmount: d('500'),
    verifiedAmount: d('120'),
    spentAmount: d('20'),
  },
];

const stats = new Map<string, CampaignStats>([
  ['c1', { pending: d('250000'), demo: d('50000'), donorsCount: 4 }],
  ['c2', { pending: d('0'), demo: d('0'), donorsCount: 2 }],
  ['c3', { pending: d('100000.40'), demo: d('75000'), donorsCount: 3 }],
  ['c4', { pending: d('0'), demo: d('0'), donorsCount: 1 }],
  ['c5', { pending: d('10'), demo: d('5'), donorsCount: 1 }],
]);

const beneficiaryLinks = [
  { beneficiaryId: 'b1', campaign: { categoryId: CAT_MED }, beneficiary: { kind: 'PATIENT' } },
  { beneficiaryId: 'b2', campaign: { categoryId: CAT_ORPH }, beneficiary: { kind: 'ORPHAN' } },
  { beneficiaryId: 'b3', campaign: { categoryId: CAT_ORPH }, beneficiary: { kind: 'ORPHAN' } },
  // b3 is linked twice (two orphan campaigns): counted once.
  { beneficiaryId: 'b3', campaign: { categoryId: CAT_ORPH }, beneficiary: { kind: 'ORPHAN' } },
  { beneficiaryId: 'b4', campaign: { categoryId: CAT_HOME }, beneficiary: { kind: 'FAMILY' } },
];

function setup() {
  const calls: Record<string, unknown[]> = { pledgeGroupBy: [], pledgeFindMany: [] };
  const prisma = {
    campaign: { findMany: jest.fn().mockResolvedValue(campaigns) },
    campaignCategory: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: CAT_MED,
          code: 'MEDICAL_AID',
          nameAr: 'مساعدات طبية',
          nameEn: 'Medical aid',
          icon: 'stethoscope',
        },
        {
          id: CAT_ORPH,
          code: 'ORPHAN_SPONSORSHIP',
          nameAr: 'كفالة أيتام',
          nameEn: 'Orphan sponsorship',
          icon: 'heart-hand',
        },
        {
          id: CAT_HOME,
          code: 'HOME_RENOVATION',
          nameAr: 'ترميم منازل',
          nameEn: 'Home renovation',
          icon: 'home',
        },
        // Added later by ADMIN: no campaigns yet, still listed (data-driven).
        { id: CAT_NEW, code: 'WINTER_AID', nameAr: 'تدفئة', nameEn: '', icon: 'flame' },
      ]),
    },
    pledge: {
      groupBy: jest.fn(async (args: unknown) => {
        calls.pledgeGroupBy.push(args);
        return [
          {
            channel: 'PLATFORM',
            method: 'BEMO_TRANSFER',
            _sum: { amount: d('6000000.10') },
            _count: { _all: 5 },
          },
          {
            channel: 'PLATFORM',
            method: 'CASH',
            _sum: { amount: d('500000') },
            _count: { _all: 1 },
          },
          {
            channel: 'COLLECTOR',
            method: 'CASH',
            _sum: { amount: d('1650000.50') },
            _count: { _all: 2 },
          },
          {
            channel: 'COUNCIL',
            method: 'CASH',
            _sum: { amount: d('3500000') },
            _count: { _all: 2 },
          },
        ];
      }),
      findMany: jest.fn(async (args: { take?: number }) => {
        calls.pledgeFindMany.push(args);
        if (args.take) {
          return [
            {
              amount: d('250000'),
              currency: 'SYP',
              verifiedAt: new Date('2026-11-21T09:00:00Z'),
              isAnonymousDisplay: false,
              donorName: 'سامر الأحمد (مثال)',
              campaign: {
                slug: 'surgery-demo1',
                titleAr: 'عملية',
                titleEn: 'Surgery',
                category: {
                  code: 'MEDICAL_AID',
                  nameAr: 'مساعدات طبية',
                  nameEn: 'Medical aid',
                  icon: 'stethoscope',
                },
              },
            },
            {
              amount: d('100000'),
              currency: 'SYP',
              verifiedAt: new Date('2026-11-20T09:00:00Z'),
              isAnonymousDisplay: true,
              donorName: 'ليلى الحسن (مثال)',
              campaign: {
                slug: 'orphans-2027',
                titleAr: 'كفالة',
                titleEn: null,
                category: {
                  code: 'ORPHAN_SPONSORSHIP',
                  nameAr: 'كفالة أيتام',
                  nameEn: 'Orphan sponsorship',
                  icon: 'heart-hand',
                },
              },
            },
          ];
        }
        return [
          { amount: d('300000.25'), verifiedAt: new Date('2026-11-02T00:00:00Z') },
          { amount: d('200000.50'), verifiedAt: new Date('2026-11-30T23:59:59Z') },
          { amount: d('1000000'), verifiedAt: new Date('2025-12-01T00:00:00Z') },
          // Out of the window (before the first month): ignored.
          { amount: d('999'), verifiedAt: new Date('2025-11-30T23:59:59Z') },
        ];
      }),
    },
    expenditure: {
      groupBy: jest.fn().mockResolvedValue([
        { payeeType: 'HOSPITAL', _sum: { amount: d('1000000.05') }, _count: { _all: 1 } },
        {
          payeeType: 'BENEFICIARY_FAMILY',
          _sum: { amount: d('800000') },
          _count: { _all: 4 },
        },
        { payeeType: 'CONTRACTOR', _sum: { amount: d('750000') }, _count: { _all: 1 } },
      ]),
      findMany: jest.fn(async (args: { take?: number }) => {
        if (args.take) {
          return [
            {
              id: 'e1',
              paidAt: new Date('2026-11-20T00:00:00Z'),
              createdAt: new Date('2026-11-20T00:00:00Z'),
              payeeType: 'BENEFICIARY_FAMILY',
              payeeLabel: 'أسرة مكفولة',
              hospital: null,
              beneficiary: { publicCode: 'B-1042' },
              amount: d('200000'),
              currency: 'SYP',
              description: 'كفالة شهر',
              descriptionEn: 'Monthly sponsorship',
              periodMonth: '2026-11',
              proofPublic: false,
              proofDocument: { mimeType: 'image/jpeg' },
              campaign: {
                id: 'c3',
                slug: 'orphans-2027',
                titleAr: 'كفالة',
                titleEn: 'Sponsorship',
                category: { icon: 'heart-hand' },
              },
            },
          ];
        }
        return [{ amount: d('800000'), paidAt: new Date('2026-11-20T00:00:00Z') }];
      }),
    },
    campaignBeneficiary: { findMany: jest.fn().mockResolvedValue(beneficiaryLinks) },
  };
  const campaignStats = {
    forCampaigns: jest.fn().mockResolvedValue(stats),
  } as unknown as CampaignStatsService;
  const service = new StatsService(prisma as unknown as PrismaService, campaignStats);
  return { service, prisma, calls };
}

const sum = (values: string[]) => values.reduce((a, v) => a.plus(v), d(0)).toFixed(2);

describe('StatsService.transparency', () => {
  it('platform totals equal the sum of the SYP campaign ledgers, exactly', async () => {
    const { service } = setup();
    const result = await service.transparency('ar', NOW);
    const ledgers = campaigns
      .filter((c) => c.currency === 'SYP')
      .map((c) =>
        computeLedger({
          campaignId: c.id,
          currency: 'SYP',
          targetAmount: c.targetAmount,
          verifiedAmount: c.verifiedAmount,
          spentAmount: c.spentAmount,
          pending: stats.get(c.id)?.pending,
          demo: stats.get(c.id)?.demo,
        }),
      );
    expect(result.totals).toEqual({
      currency: 'SYP',
      targetAmount: sum(ledgers.map((l) => l.targetAmount)),
      verifiedAmount: sum(ledgers.map((l) => l.verifiedAmount)),
      pendingAmount: sum(ledgers.map((l) => l.pendingAmount)),
      spentAmount: sum(ledgers.map((l) => l.spentAmount)),
      remainingAmount: sum(ledgers.map((l) => l.remainingAmount)),
      spentPercent: '21.9',
      demoAmount: sum(ledgers.map((l) => l.demoAmount)),
    });
    expect(result.totals.verifiedAmount).toBe('11650000.60');
    expect(result.totals.remainingAmount).toBe('9100000.55');
  });

  it('never adds demo money: it is reported apart and only verified money counts', async () => {
    const { service, calls } = setup();
    const result = await service.transparency('ar', NOW);
    expect(result.totals.demoAmount).toBe('125000.00');
    // verified = stored campaign balances only (no demo, no pending)
    expect(result.totals.verifiedAmount).toBe(
      sum(
        campaigns.filter((c) => c.currency === 'SYP').map((c) => c.verifiedAmount.toFixed(2)),
      ),
    );
    for (const args of [...calls.pledgeGroupBy, ...calls.pledgeFindMany]) {
      expect(args).toMatchObject({ where: { status: 'VERIFIED', isDemo: false } });
    }
    const verifiedByCategory = sum(result.categories.map((c) => c.verifiedAmount));
    expect(verifiedByCategory).toBe(result.totals.verifiedAmount);
  });

  it('keeps other currencies apart, never converted into the SYP totals', async () => {
    const { service } = setup();
    const result = await service.transparency('ar', NOW);
    expect(result.otherCurrencies).toEqual([
      expect.objectContaining({
        currency: 'USD',
        verifiedAmount: '120.00',
        spentAmount: '20.00',
        demoAmount: '5.00',
      }),
    ]);
    expect(result.campaigns).toEqual({ active: 3, funded: 1, completed: 1, total: 5 });
  });

  it('breaks down by category from the data, including a category added later', async () => {
    const { service } = setup();
    const result = await service.transparency('en', NOW);
    expect(result.categories.map((c) => c.code)).toEqual([
      'MEDICAL_AID',
      'ORPHAN_SPONSORSHIP',
      'HOME_RENOVATION',
      'WINTER_AID',
    ]);
    const med = result.categories[0];
    expect(med).toMatchObject({
      name: 'Medical aid',
      campaignsCount: 2,
      verifiedAmount: '7900000.30',
      spentAmount: '1000000.05',
      remainingAmount: '6900000.25',
      beneficiariesCount: 1,
    });
    expect(result.categories[1].beneficiariesCount).toBe(2);
    // An empty English name falls back to Arabic; no campaigns → zeros.
    expect(result.categories[3]).toMatchObject({
      name: 'تدفئة',
      campaignsCount: 0,
      verifiedAmount: '0.00',
    });
  });

  it('groups channels (donor cash at a point counts with collector cash) and payee types', async () => {
    const { service } = setup();
    const result = await service.transparency('ar', NOW);
    expect(result.channels).toEqual([
      { channel: 'TRANSFER', amount: '6000000.10', count: 5 },
      { channel: 'COLLECTION_POINT', amount: '2150000.50', count: 3 },
      { channel: 'COUNCIL', amount: '3500000.00', count: 2 },
    ]);
    expect(result.payeeTypes).toEqual([
      { payeeType: 'HOSPITAL', amount: '1000000.05', count: 1 },
      { payeeType: 'CONTRACTOR', amount: '750000.00', count: 1 },
      { payeeType: 'SUPPLIER', amount: '0.00', count: 0 },
      { payeeType: 'BENEFICIARY_FAMILY', amount: '800000.00', count: 4 },
      { payeeType: 'OTHER', amount: '0.00', count: 0 },
    ]);
  });

  it('builds 12 calendar months, oldest first, verified by verification date vs spent by date', async () => {
    const { service } = setup();
    const result = await service.transparency('ar', NOW);
    expect(result.monthly).toHaveLength(12);
    expect(result.monthly[0]).toEqual({
      month: '2025-12',
      verifiedAmount: '1000000.00',
      spentAmount: '0.00',
    });
    expect(result.monthly[11]).toEqual({
      month: '2026-11',
      verifiedAmount: '500000.75',
      spentAmount: '800000.00',
    });
  });

  it('counts distinct beneficiaries by kind, never returning who they are', async () => {
    const { service } = setup();
    const result = await service.transparency('ar', NOW);
    expect(result.beneficiaries).toEqual({
      total: 4,
      byKind: [
        { kind: 'PATIENT', count: 1 },
        { kind: 'ORPHAN', count: 2 },
        { kind: 'FAMILY', count: 1 },
        { kind: 'OTHER', count: 0 },
      ],
    });
  });

  it('shows «فاعل خير» unless the donor chose to be shown, and then the first name only', async () => {
    const { service } = setup();
    const result = await service.transparency('ar', NOW);
    expect(result.recentDonations.map((x) => x.displayName)).toEqual(['سامر', null]);
    expect(result.recentExpenditures[0]).toMatchObject({
      payeeLabel: null,
      beneficiaryCode: 'B-1042',
      proof: null,
      campaign: { slug: 'orphans-2027' },
    });
  });

  it('has no identity field anywhere in the response or the CSV', async () => {
    const { service } = setup();
    const result = await service.transparency('ar', NOW);
    expect(findIdentityFields(result)).toEqual([]);
    const text = JSON.stringify(result);
    expect(text).not.toContain('الأحمد');
    expect(text).not.toContain('ليلى');
    const csv = service.toCsv(result);
    expect(csv).not.toMatch(/سامر|ليلى|B-\d{4}/);
    expect(csv).toContain('totals,verified,11650000.60,');
    expect(csv).toContain('excluded,demo_payments_not_counted,125000.00,');
  });
});

describe('stats helpers', () => {
  it.each([
    ['PLATFORM', 'BEMO_TRANSFER', 'TRANSFER'],
    ['PLATFORM', 'SHAM_CASH', 'TRANSFER'],
    ['PLATFORM', 'CASH', 'COLLECTION_POINT'],
    ['COLLECTOR', 'CASH', 'COLLECTION_POINT'],
    ['COUNCIL', 'CASH', 'COUNCIL'],
  ] as const)('channelOf(%s, %s) = %s', (channel, method, expected) => {
    expect(channelOf(channel, method)).toBe(expected);
  });

  it('lastMonths crosses the year boundary', () => {
    expect(lastMonths(new Date('2026-02-10T00:00:00Z'), 3)).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('percent is exact and safe for zero', () => {
    expect(percent(d('1'), d('3'))).toBe('33.3');
    expect(percent(d('2'), d('3'))).toBe('66.7');
    expect(percent(d('5'), d('0'))).toBe('0.0');
  });

  it('displayNameOf hides anonymous donors and keeps only the first name', () => {
    expect(displayNameOf(true, 'سامر الأحمد')).toBeNull();
    expect(displayNameOf(false, null)).toBeNull();
    expect(displayNameOf(false, '  Samer  Ahmad ')).toBe('Samer');
  });
});
