import { describe, expect, it } from 'vitest';
import { sumMoney } from './money';

describe('sumMoney', () => {
  it('adds decimal strings exactly', () => {
    expect(sumMoney(['0.10', '0.20'])).toBe('0.30');
    expect(sumMoney(['5500000.00', '1500000.00', '3000000.00'])).toBe('10000000.00');
  });

  it('handles one-digit fractions, negatives and empty input', () => {
    expect(sumMoney(['1.5', '2'])).toBe('3.50');
    expect(sumMoney(['1.00', '-2.25'])).toBe('-1.25');
    expect(sumMoney([])).toBe('0.00');
  });
});
