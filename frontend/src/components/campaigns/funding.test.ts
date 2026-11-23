import { describe, expect, it } from 'vitest';
import { fundingSegments } from './funding';

describe('fundingSegments', () => {
  it('stacks verified, pending and demo as percentages of the target', () => {
    expect(
      fundingSegments({ target: '1000', verified: '250', pending: '100', demo: '50' }),
    ).toEqual({ verified: 25, pending: 10, demo: 5, verifiedPercent: 25 });
  });

  it('never lets the stack exceed 100%, verified first', () => {
    const s = fundingSegments({ target: '100', verified: '80', pending: '30', demo: '30' });
    expect(s.verified + s.pending + s.demo).toBe(100);
    expect(s).toMatchObject({ verified: 80, pending: 20, demo: 0 });
  });

  it('reports real over-funding in the label but clamps the bar', () => {
    const s = fundingSegments({ target: '100', verified: '150', pending: '0', demo: '0' });
    expect(s.verified).toBe(100);
    expect(s.verifiedPercent).toBe(150);
  });

  it('demo never counts toward the verified percentage', () => {
    expect(
      fundingSegments({ target: '100', verified: '0', pending: '0', demo: '90' }).verifiedPercent,
    ).toBe(0);
  });

  it('handles a zero or invalid target', () => {
    expect(fundingSegments({ target: '0', verified: '5', pending: '0', demo: '0' })).toEqual({
      verified: 0,
      pending: 0,
      demo: 0,
      verifiedPercent: 0,
    });
  });
});
