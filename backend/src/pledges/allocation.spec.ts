import { Prisma } from '@prisma/client';
import { planPledge, quote, remainingNeed, splitOnApproval } from './allocation';

const d = (v: string | number) => new Prisma.Decimal(v);

describe('allocation rules (docs/fund-contract.md)', () => {
  it('remaining need = target − verified − reserved, never negative', () => {
    expect(remainingNeed(d(100_000), d(50_000), d(20_000)).toFixed(2)).toBe('30000.00');
    expect(remainingNeed(d(100_000), d(90_000), d(20_000)).toFixed(2)).toBe('0.00');
  });

  it('30,000 remaining + 50,000 offered → SURPLUS 30,000 campaign + 20,000 fund', () => {
    const q = quote(d(50_000), d(30_000));
    expect(q.state).toBe('SURPLUS');
    expect(q.campaignShare.toFixed(2)).toBe('30000.00');
    expect(q.surplus.toFixed(2)).toBe('20000.00');
  });

  it('within the need, exact target and uncapped campaigns keep the normal flow', () => {
    expect(quote(d(30_000), d(30_000)).state).toBe('WITHIN');
    expect(quote(d(10_000), d(30_000)).state).toBe('WITHIN');
    expect(quote(d(50_000), null).state).toBe('WITHIN');
    expect(planPledge(d(30_000), d(30_000))).toEqual({ amount: d(30_000), fundAmount: d(0) });
  });

  it('a complete campaign offers the fund instead', () => {
    expect(quote(d(50_000), d(0)).state).toBe('COMPLETE');
    expect(planPledge(d(50_000), d(0), 'SPLIT')).toBe('campaign_complete');
  });

  it('SPLIT records the full amount with the fund share; REMAINING_ONLY records only the need', () => {
    const split = planPledge(d(50_000), d(30_000), 'SPLIT', '30000');
    expect(split).toEqual({ amount: d(50_000), fundAmount: d(20_000) });
    const only = planPledge(d(50_000), d(30_000), 'REMAINING_ONLY', '30000.00');
    expect(only).toEqual({ amount: d(30_000), fundAmount: d(0) });
  });

  it('asks for a choice, and refuses a stale quote', () => {
    expect(planPledge(d(50_000), d(30_000))).toBe('surplus_choice_required');
    expect(planPledge(d(50_000), d(10_000), 'SPLIT', '30000')).toBe('allocation_changed');
  });

  it('approval: a SPLIT pledge credits 30,000 to the campaign and 20,000 to the fund', () => {
    const s = splitOnApproval({
      amount: d(50_000),
      fundAmount: d(20_000),
      capped: true,
      target: d(100_000),
      verified: d(70_000),
    });
    expect([s.campaignCredit, s.fundAmount, s.heldAmount].map((x) => x.toFixed(2))).toEqual([
      '30000.00',
      '20000.00',
      '0.00',
    ]);
  });

  it('approval never overfunds: extra goes to the fund only when the donor chose SPLIT', () => {
    // Another donation filled the campaign first: only 10,000 room left.
    const split = splitOnApproval({
      amount: d(50_000),
      fundAmount: d(20_000),
      capped: true,
      target: d(100_000),
      verified: d(90_000),
    });
    expect(
      [split.campaignCredit, split.fundAmount, split.heldAmount].map((x) => x.toFixed(2)),
    ).toEqual(['10000.00', '40000.00', '0.00']);
    const held = splitOnApproval({
      amount: d(30_000),
      fundAmount: d(0),
      capped: true,
      target: d(100_000),
      verified: d(90_000),
    });
    expect(
      [held.campaignCredit, held.fundAmount, held.heldAmount].map((x) => x.toFixed(2)),
    ).toEqual(['10000.00', '0.00', '20000.00']);
  });

  it('uncapped campaigns (fund, ongoing programmes) take everything', () => {
    const s = splitOnApproval({
      amount: d(50_000),
      fundAmount: d(0),
      capped: false,
      target: d(0),
      verified: d(999_999),
    });
    expect(s.campaignCredit.toFixed(2)).toBe('50000.00');
    expect(s.heldAmount.toFixed(2)).toBe('0.00');
  });
});
