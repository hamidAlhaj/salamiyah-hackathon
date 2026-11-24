/**
 * Widths (in % of the target) of the three funding segments, stacked and clamped to 100.
 * Same rule as frontend/src/components/campaigns/funding.ts: verified, then pending, then demo.
 */
export interface FundingSegments {
  verified: number;
  pending: number;
  demo: number;
  /** Real verified progress (floored), may exceed 100 when over-funded. */
  verifiedPercent: number;
}

const toNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function fundingSegments(amounts: {
  target: string;
  verified: string;
  pending: string;
  demo: string;
}): FundingSegments {
  const target = toNumber(amounts.target);
  if (target === 0) return { verified: 0, pending: 0, demo: 0, verifiedPercent: 0 };
  const pct = (v: string) => (toNumber(v) / target) * 100;
  const verified = Math.min(100, pct(amounts.verified));
  const pending = Math.min(100 - verified, pct(amounts.pending));
  const demo = Math.min(100 - verified - pending, pct(amounts.demo));
  return { verified, pending, demo, verifiedPercent: Math.floor(pct(amounts.verified)) };
}
