import { describe, expect, it } from 'vitest';
import { columnPath, monthlyLayout, niceScale, share } from './chart-geometry';

describe('niceScale', () => {
  it('rounds up to a nice maximum with even ticks', () => {
    expect(niceScale(12_400_000)).toEqual({
      max: 15_000_000,
      ticks: [0, 5_000_000, 10_000_000, 15_000_000],
    });
    expect(niceScale(800_000).max).toBe(800_000);
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
  });
});

describe('columnPath', () => {
  it('rounds the data end only and keeps the baseline square', () => {
    expect(columnPath(10, 100, 20, 50)).toBe('M10 100 V54 Q10 50 14 50 H26 Q30 50 30 54 V100 Z');
  });

  it('draws nothing for a zero value and shrinks the radius for tiny bars', () => {
    expect(columnPath(0, 100, 20, 0)).toBe('');
    expect(columnPath(0, 100, 20, 2)).toContain('V100 Q0 98 2 98');
  });
});

describe('monthlyLayout', () => {
  const rows = [
    { collected: 100, spent: 0 },
    { collected: 50, spent: 25 },
  ];

  it('runs oldest-first left to right in LTR, with collected left of spent', () => {
    const l = monthlyLayout(rows, { width: 200, height: 130, rtl: false, axis: 40 });
    expect(l.bands[0].center).toBeLessThan(l.bands[1].center);
    expect(l.bands[1].collected.x).toBeLessThan(l.bands[1].spent.x);
    expect(l.plot.left).toBe(40);
  });

  it('mirrors in RTL: oldest on the right, collected right of spent, axis on the right', () => {
    const l = monthlyLayout(rows, { width: 200, height: 130, rtl: true, axis: 40 });
    expect(l.bands[0].center).toBeGreaterThan(l.bands[1].center);
    expect(l.bands[1].collected.x).toBeGreaterThan(l.bands[1].spent.x);
    expect(l.plot.right).toBe(160);
  });

  it('caps bars at 24px and leaves a 2px gap inside each pair', () => {
    const l = monthlyLayout(rows, { width: 1000, height: 130, rtl: false, axis: 40 });
    expect(l.barWidth).toBe(24);
    expect(l.bands[0].spent.x - (l.bands[0].collected.x + l.barWidth)).toBe(2);
  });
});

describe('share', () => {
  it('is a one-decimal percentage and 0 for an empty whole', () => {
    expect(share(1, 3)).toBe(33.3);
    expect(share(5, 0)).toBe(0);
  });
});
