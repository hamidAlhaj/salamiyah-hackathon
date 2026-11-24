import { Prisma } from '@prisma/client';
import { computeLedger } from './campaign-ledger';

const d = (v: string | number) => new Prisma.Decimal(v);
const base = {
  campaignId: '11111111-1111-1111-1111-111111111111',
  currency: 'SYP' as const,
  targetAmount: d(10_000_000),
};

describe('computeLedger (the campaign account)', () => {
  it('remaining = verified − spent, with 2-decimal strings', () => {
    const ledger = computeLedger({
      ...base,
      verifiedAmount: d('7500000.5'),
      spentAmount: d('2500000.25'),
    });
    expect(ledger.verifiedAmount).toBe('7500000.50');
    expect(ledger.spentAmount).toBe('2500000.25');
    expect(ledger.remainingAmount).toBe('5000000.25');
    expect(ledger.targetAmount).toBe('10000000.00');
  });

  it('never adds pending or demo money to verified, spent or remaining', () => {
    const ledger = computeLedger({
      ...base,
      verifiedAmount: d(3_000_000),
      spentAmount: d(1_000_000),
      pending: d(750_000),
      demo: d(400_000),
    });
    expect(ledger.verifiedAmount).toBe('3000000.00');
    expect(ledger.remainingAmount).toBe('2000000.00');
    expect(ledger.pendingAmount).toBe('750000.00');
    expect(ledger.demoAmount).toBe('400000.00');
  });

  it('defaults missing aggregates to zero', () => {
    const ledger = computeLedger({ ...base, verifiedAmount: d(0), spentAmount: d(0) });
    expect(ledger).toMatchObject({
      pendingAmount: '0.00',
      demoAmount: '0.00',
      remainingAmount: '0.00',
      donorsCount: 0,
      beneficiariesCount: 0,
    });
  });

  it('keeps exact decimals (no floating-point drift)', () => {
    const ledger = computeLedger({ ...base, verifiedAmount: d('0.3'), spentAmount: d('0.1') });
    expect(ledger.remainingAmount).toBe('0.20');
  });

  it('passes counts through', () => {
    const ledger = computeLedger({
      ...base,
      verifiedAmount: d(1),
      spentAmount: d(0),
      donorsCount: 7,
      beneficiariesCount: 12,
    });
    expect(ledger.donorsCount).toBe(7);
    expect(ledger.beneficiariesCount).toBe(12);
  });
});
