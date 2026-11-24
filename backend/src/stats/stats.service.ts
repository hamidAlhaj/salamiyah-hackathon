import { Injectable } from '@nestjs/common';
import {
  BeneficiaryKind,
  Currency,
  PayeeType,
  PledgeChannel,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import { CampaignStatsService } from '../campaigns/campaign-stats.service';
import { PUBLIC_STATUSES } from '../campaigns/campaigns.service';
import { money } from '../common/utils/money';
import type {
  TransparencyCategory,
  TransparencyChannel,
  TransparencyDonation,
  TransparencyExpenditure,
  TransparencyMonth,
  TransparencyStats,
  TransparencyTotals,
} from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Every breakdown is in this currency; other currencies are totalled apart, never converted. */
export const PRIMARY_CURRENCY: Currency = 'SYP';
const MONTHS = 12;
const RECENT = 6;
const ZERO = () => new Prisma.Decimal(0);
const publicCampaign = {
  status: { in: [...PUBLIC_STATUSES] },
} satisfies Prisma.CampaignWhereInput;
const CHANNELS: TransparencyChannel[] = ['TRANSFER', 'COLLECTION_POINT', 'COUNCIL'];
const BENEFICIARY_KINDS: BeneficiaryKind[] = ['PATIENT', 'ORPHAN', 'FAMILY', 'OTHER'];
const PAYEE_TYPES: PayeeType[] = [
  'HOSPITAL',
  'CONTRACTOR',
  'SUPPLIER',
  'BENEFICIARY_FAMILY',
  'OTHER',
];

/** Online and transfers; donor cash at a point (PLATFORM + CASH) counts with collector cash. */
export function channelOf(channel: PledgeChannel, method: PaymentMethod): TransparencyChannel {
  if (channel === 'COUNCIL') return 'COUNCIL';
  if (channel === 'COLLECTOR' || method === 'CASH') return 'COLLECTION_POINT';
  return 'TRANSFER';
}

/** The last `count` calendar months (UTC), oldest first, as YYYY-MM. */
export function lastMonths(now: Date, count = MONTHS): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

/** spent ÷ verified × 100 with one decimal, exact (Decimal), "0.0" for nothing verified. */
export function percent(part: Prisma.Decimal, whole: Prisma.Decimal): string {
  if (whole.lte(0)) return '0.0';
  return part.mul(100).div(whole).toDecimalPlaces(1, Prisma.Decimal.ROUND_HALF_UP).toFixed(1);
}

/** A public donor label: the first name only, and only when the donor did not ask for «فاعل خير». */
export function displayNameOf(anonymous: boolean, name: string | null): string | null {
  if (anonymous || !name) return null;
  const first = name.trim().split(/\s+/)[0];
  return first ? first : null;
}

interface Acc {
  target: Prisma.Decimal;
  verified: Prisma.Decimal;
  pending: Prisma.Decimal;
  spent: Prisma.Decimal;
  demo: Prisma.Decimal;
}

function toTotals(currency: Currency, a: Acc): TransparencyTotals {
  return {
    currency,
    targetAmount: money(a.target),
    verifiedAmount: money(a.verified),
    pendingAmount: money(a.pending),
    spentAmount: money(a.spent),
    remainingAmount: money(a.verified.minus(a.spent)),
    spentPercent: percent(a.spent, a.verified),
    demoAmount: money(a.demo),
  };
}

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignStats: CampaignStatsService,
  ) {}

  /**
   * Public transparency aggregates over the public campaigns (ACTIVE, FUNDED, COMPLETED), so the
   * totals equal the sum of their ledgers. Verified and spent are the campaign account balances;
   * pending and demo come from the same stats the ledger uses. Demo money is never added.
   */
  async transparency(lang: 'ar' | 'en', now = new Date()): Promise<TransparencyStats> {
    const en = lang === 'en';
    const months = lastMonths(now);
    const since = new Date(`${months[0]}-01T00:00:00.000Z`);

    const campaigns = await this.prisma.campaign.findMany({
      where: publicCampaign,
      select: {
        id: true,
        status: true,
        currency: true,
        categoryId: true,
        isGeneralFund: true,
        targetAmount: true,
        verifiedAmount: true,
        spentAmount: true,
      },
    });
    const ids = campaigns.map((c) => c.id);
    const primaryIds = campaigns
      .filter((c) => c.currency === PRIMARY_CURRENCY)
      .map((c) => c.id);
    const inPrimary = { campaignId: { in: primaryIds } };

    const [
      stats,
      categories,
      channelRows,
      payeeRows,
      monthPledges,
      monthSpend,
      links,
      recentE,
      recentD,
    ] = await Promise.all([
      this.campaignStats.forCampaigns(ids),
      this.prisma.campaignCategory.findMany({
        where: { OR: [{ isActive: true }, { campaigns: { some: publicCampaign } }] },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, code: true, nameAr: true, nameEn: true, icon: true },
      }),
      this.prisma.pledge.groupBy({
        by: ['channel', 'method'],
        where: { ...inPrimary, status: 'VERIFIED', isDemo: false },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.expenditure.groupBy({
        by: ['payeeType'],
        where: inPrimary,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.pledge.findMany({
        where: { ...inPrimary, status: 'VERIFIED', isDemo: false, verifiedAt: { gte: since } },
        select: { amount: true, verifiedAt: true },
      }),
      this.prisma.expenditure.findMany({
        where: { ...inPrimary, paidAt: { gte: since } },
        select: { amount: true, paidAt: true },
      }),
      // Active links only (as the ledger counts them); the kind is public, the person is not.
      this.prisma.campaignBeneficiary.findMany({
        where: { endedAt: null, campaign: publicCampaign },
        select: {
          beneficiaryId: true,
          campaign: { select: { categoryId: true } },
          beneficiary: { select: { kind: true } },
        },
      }),
      this.prisma.expenditure.findMany({
        where: { campaign: publicCampaign },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        take: RECENT,
        include: {
          hospital: { select: { nameAr: true, nameEn: true } },
          beneficiary: { select: { publicCode: true } },
          proofDocument: { select: { mimeType: true } },
          campaign: {
            select: {
              id: true,
              slug: true,
              titleAr: true,
              titleEn: true,
              category: { select: { icon: true } },
            },
          },
        },
      }),
      this.prisma.pledge.findMany({
        where: { status: 'VERIFIED', isDemo: false, campaign: publicCampaign },
        orderBy: [{ verifiedAt: 'desc' }, { createdAt: 'desc' }],
        take: RECENT,
        select: {
          amount: true,
          currency: true,
          verifiedAt: true,
          isAnonymousDisplay: true,
          donorName: true,
          campaign: {
            select: {
              slug: true,
              titleAr: true,
              titleEn: true,
              category: { select: { code: true, nameAr: true, nameEn: true, icon: true } },
            },
          },
        },
      }),
    ]);

    // ── totals per currency, and per category in the primary currency ──
    const byCurrency = new Map<Currency, Acc>();
    const byCategory = new Map<string, Acc & { campaigns: number }>();
    // The general council fund adds to the money totals but is not a campaign in the counts.
    const counts = {
      active: 0,
      funded: 0,
      completed: 0,
      total: campaigns.filter((c) => !c.isGeneralFund).length,
    };
    for (const c of campaigns) {
      const s = stats.get(c.id);
      const acc = byCurrency.get(c.currency) ?? {
        target: ZERO(),
        verified: ZERO(),
        pending: ZERO(),
        spent: ZERO(),
        demo: ZERO(),
      };
      acc.target = acc.target.plus(c.targetAmount);
      acc.verified = acc.verified.plus(c.verifiedAmount);
      acc.spent = acc.spent.plus(c.spentAmount);
      acc.pending = acc.pending.plus(s?.pending ?? 0);
      acc.demo = acc.demo.plus(s?.demo ?? 0);
      byCurrency.set(c.currency, acc);
      if (c.isGeneralFund) {
        // counted in the money totals above and in its own category below, not as a campaign
      } else if (c.status === 'ACTIVE') counts.active++;
      else if (c.status === 'FUNDED') counts.funded++;
      else counts.completed++;

      if (c.currency !== PRIMARY_CURRENCY) continue;
      const cat = byCategory.get(c.categoryId) ?? {
        target: ZERO(),
        verified: ZERO(),
        pending: ZERO(),
        spent: ZERO(),
        demo: ZERO(),
        campaigns: 0,
      };
      cat.target = cat.target.plus(c.targetAmount);
      cat.verified = cat.verified.plus(c.verifiedAmount);
      cat.spent = cat.spent.plus(c.spentAmount);
      cat.campaigns++;
      byCategory.set(c.categoryId, cat);
    }
    const empty = {
      target: ZERO(),
      verified: ZERO(),
      pending: ZERO(),
      spent: ZERO(),
      demo: ZERO(),
    };
    const totals = toTotals(PRIMARY_CURRENCY, byCurrency.get(PRIMARY_CURRENCY) ?? empty);
    const otherCurrencies = [...byCurrency.entries()]
      .filter(([cur]) => cur !== PRIMARY_CURRENCY)
      .map(([cur, a]) => toTotals(cur, a));

    // ── beneficiaries: distinct people, by kind and by category (counts only) ──
    const everyone = new Set<string>();
    const kinds = new Map<BeneficiaryKind, Set<string>>();
    const perCategory = new Map<string, Set<string>>();
    for (const l of links) {
      everyone.add(l.beneficiaryId);
      const k = kinds.get(l.beneficiary.kind) ?? new Set<string>();
      k.add(l.beneficiaryId);
      kinds.set(l.beneficiary.kind, k);
      const p = perCategory.get(l.campaign.categoryId) ?? new Set<string>();
      p.add(l.beneficiaryId);
      perCategory.set(l.campaign.categoryId, p);
    }

    const categoryRows: TransparencyCategory[] = categories.map((cat) => {
      const a = byCategory.get(cat.id);
      return {
        code: cat.code,
        name: (en ? cat.nameEn : null) || cat.nameAr,
        icon: cat.icon,
        campaignsCount: a?.campaigns ?? 0,
        targetAmount: money(a?.target),
        verifiedAmount: money(a?.verified),
        spentAmount: money(a?.spent),
        remainingAmount: money((a?.verified ?? ZERO()).minus(a?.spent ?? ZERO())),
        beneficiariesCount: perCategory.get(cat.id)?.size ?? 0,
      };
    });

    // ── channels and payee types (primary currency) ──
    const channelAcc = new Map<
      TransparencyChannel,
      { amount: Prisma.Decimal; count: number }
    >();
    for (const r of channelRows) {
      const key = channelOf(r.channel, r.method);
      const a = channelAcc.get(key) ?? { amount: ZERO(), count: 0 };
      a.amount = a.amount.plus(r._sum.amount ?? 0);
      a.count += r._count._all;
      channelAcc.set(key, a);
    }
    const payeeAcc = new Map(payeeRows.map((r) => [r.payeeType, r]));

    // ── the monthly series ──
    const monthAcc = new Map(months.map((m) => [m, { verified: ZERO(), spent: ZERO() }]));
    for (const p of monthPledges) {
      const slot = p.verifiedAt && monthAcc.get(monthKey(p.verifiedAt));
      if (slot) slot.verified = slot.verified.plus(p.amount);
    }
    for (const e of monthSpend) {
      const slot = monthAcc.get(monthKey(e.paidAt));
      if (slot) slot.spent = slot.spent.plus(e.amount);
    }
    const monthly: TransparencyMonth[] = months.map((m) => {
      const slot = monthAcc.get(m);
      return {
        month: m,
        verifiedAmount: money(slot?.verified),
        spentAmount: money(slot?.spent),
      };
    });

    const recentExpenditures: TransparencyExpenditure[] = recentE.map((e) => ({
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
      campaign: {
        id: e.campaign.id,
        slug: e.campaign.slug,
        title: (en ? e.campaign.titleEn : null) ?? e.campaign.titleAr,
        categoryIcon: e.campaign.category.icon,
      },
    }));

    const recentDonations: TransparencyDonation[] = recentD.map((p) => ({
      amount: money(p.amount),
      currency: p.currency,
      verifiedAt: (p.verifiedAt ?? now).toISOString(),
      category: {
        code: p.campaign.category.code,
        name: (en ? p.campaign.category.nameEn : null) || p.campaign.category.nameAr,
        icon: p.campaign.category.icon,
      },
      campaign: {
        slug: p.campaign.slug,
        title: (en ? p.campaign.titleEn : null) ?? p.campaign.titleAr,
      },
      displayName: displayNameOf(p.isAnonymousDisplay, p.donorName),
    }));

    return {
      generatedAt: now.toISOString(),
      totals,
      otherCurrencies,
      campaigns: counts,
      categories: categoryRows,
      channels: CHANNELS.map((channel) => ({
        channel,
        amount: money(channelAcc.get(channel)?.amount),
        count: channelAcc.get(channel)?.count ?? 0,
      })),
      payeeTypes: PAYEE_TYPES.map((payeeType) => ({
        payeeType,
        amount: money(payeeAcc.get(payeeType)?._sum.amount),
        count: payeeAcc.get(payeeType)?._count._all ?? 0,
      })),
      monthly,
      beneficiaries: {
        total: everyone.size,
        byKind: BENEFICIARY_KINDS.map((kind) => ({ kind, count: kinds.get(kind)?.size ?? 0 })),
      },
      recentExpenditures,
      recentDonations,
    };
  }

  /** Aggregate numbers only (section, key, amount, count): never a name, code or phone. */
  toCsv(s: TransparencyStats): string {
    const rows: (string | number)[][] = [['section', 'key', 'amount', 'count']];
    const t = s.totals;
    rows.push(['totals', 'currency', t.currency, '']);
    rows.push(['totals', 'verified', t.verifiedAmount, '']);
    rows.push(['totals', 'pending_verification', t.pendingAmount, '']);
    rows.push(['totals', 'spent', t.spentAmount, '']);
    rows.push(['totals', 'remaining', t.remainingAmount, '']);
    rows.push(['totals', 'spent_percent', t.spentPercent, '']);
    rows.push(['totals', 'beneficiaries', '', s.beneficiaries.total]);
    rows.push(['excluded', 'demo_payments_not_counted', t.demoAmount, '']);
    for (const c of s.categories) {
      rows.push(['category_verified', c.code, c.verifiedAmount, c.campaignsCount]);
      rows.push(['category_spent', c.code, c.spentAmount, '']);
      rows.push(['category_beneficiaries', c.code, '', c.beneficiariesCount]);
    }
    for (const c of s.channels) rows.push(['channel', c.channel, c.amount, c.count]);
    for (const p of s.payeeTypes) rows.push(['payee_type', p.payeeType, p.amount, p.count]);
    for (const m of s.monthly) {
      rows.push(['month_verified', m.month, m.verifiedAmount, '']);
      rows.push(['month_spent', m.month, m.spentAmount, '']);
    }
    for (const k of s.beneficiaries.byKind)
      rows.push(['beneficiary_kind', k.kind, '', k.count]);
    const cell = (v: string | number) => {
      const text = String(v);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return `﻿${rows.map((r) => r.map(cell).join(',')).join('\n')}\n`;
  }
}
