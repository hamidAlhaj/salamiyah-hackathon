/**
 * Pure geometry for the server-rendered transparency charts (no chart library: low bandwidth).
 * Everything here is deterministic and unit-tested; the components only map it to SVG.
 */

/** A "nice" axis maximum (1, 2, 2.5 or 5 × 10ⁿ) at or above `value`, and its evenly spaced ticks. */
export function niceScale(value: number, tickCount = 4): { max: number; ticks: number[] } {
  if (!Number.isFinite(value) || value <= 0) return { max: 1, ticks: [0, 1] };
  const rough = value / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const max = step * Math.ceil(value / step);
  const ticks: number[] = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { max, ticks };
}

/**
 * A vertical bar with 4px rounded data-end (top) and a square end on the baseline. Heights below
 * the radius shrink the radius so tiny values still read as bars, not pills.
 */
export function columnPath(x: number, baseline: number, width: number, height: number): string {
  if (height <= 0 || width <= 0) return '';
  const r = Math.min(4, width / 2, height);
  const top = baseline - height;
  return [
    `M${fmt(x)} ${fmt(baseline)}`,
    `V${fmt(top + r)}`,
    `Q${fmt(x)} ${fmt(top)} ${fmt(x + r)} ${fmt(top)}`,
    `H${fmt(x + width - r)}`,
    `Q${fmt(x + width)} ${fmt(top)} ${fmt(x + width)} ${fmt(top + r)}`,
    `V${fmt(baseline)}`,
    'Z',
  ].join(' ');
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

export interface MonthlyLayout {
  width: number;
  height: number;
  plot: { left: number; right: number; top: number; bottom: number };
  /** One entry per month in data order (oldest first), positioned for the reading direction. */
  bands: {
    center: number;
    collected: { x: number; path: string };
    spent: { x: number; path: string };
  }[];
  /** Gridlines from the baseline up, with their y position. */
  grid: { value: number; y: number }[];
  barWidth: number;
}

/**
 * Paired columns per month. In RTL the time axis runs right to left (oldest on the right) and the
 * value labels sit on the right, so the chart reads in the page's direction.
 */
export function monthlyLayout(
  rows: { collected: number; spent: number }[],
  opts: { width: number; height: number; rtl: boolean; axis: number },
): MonthlyLayout {
  const { width, height, rtl, axis } = opts;
  const plot = {
    left: rtl ? 8 : axis,
    right: rtl ? width - axis : width - 8,
    top: 12,
    bottom: height - 30,
  };
  const peak = Math.max(0, ...rows.map((r) => Math.max(r.collected, r.spent)));
  const { max, ticks } = niceScale(peak);
  const plotHeight = plot.bottom - plot.top;
  const band = (plot.right - plot.left) / Math.max(1, rows.length);
  // Two bars and a 2px surface gap fill about 64% of the band, never wider than 24px each.
  const barWidth = Math.max(3, Math.min(24, (band * 0.64 - 2) / 2));
  const h = (v: number) => (max > 0 ? (v / max) * plotHeight : 0);

  const bands = rows.map((r, i) => {
    const center = rtl ? plot.right - band * (i + 0.5) : plot.left + band * (i + 0.5);
    // Collected comes first in reading order: left of the pair in LTR, right of it in RTL.
    const firstX = center - barWidth - 1;
    const secondX = center + 1;
    const collectedX = rtl ? secondX : firstX;
    const spentX = rtl ? firstX : secondX;
    return {
      center,
      collected: {
        x: collectedX,
        path: columnPath(collectedX, plot.bottom, barWidth, h(r.collected)),
      },
      spent: { x: spentX, path: columnPath(spentX, plot.bottom, barWidth, h(r.spent)) },
    };
  });
  const grid = ticks.map((value) => ({ value, y: plot.bottom - h(value) }));
  return { width, height, plot, bands, grid, barWidth };
}

/** Share of a part in a whole as a percentage with one decimal (0 when the whole is 0). */
export function share(part: number, whole: number): number {
  if (!(whole > 0) || !(part > 0)) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
