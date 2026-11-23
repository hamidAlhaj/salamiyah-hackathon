export interface BarSegment {
  value: number;
  /** A fill class from the chart tokens, e.g. `fill-series-spent`. */
  className: string;
}

/**
 * A horizontal bar drawn as SVG: segments stacked from the baseline (start edge), a 2px surface gap
 * between segments, 4px rounded data end, square baseline. Drawn left to right and mirrored by CSS
 * in RTL, so the baseline is always the reading start. Sits on a `bg-surface` card.
 */
export function HBar({
  segments,
  max,
  label,
  height = 12,
}: {
  segments: BarSegment[];
  max: number;
  label: string;
  height?: number;
}) {
  const pct = (v: number) => (max > 0 && v > 0 ? Math.min(100, (v / max) * 100) : 0);
  let start = 0;
  const drawn = segments
    .map((s) => {
      const x = start;
      const w = pct(s.value);
      start = Math.min(100, start + w);
      return { x, w, className: s.className };
    })
    .filter((d) => d.w > 0);
  const last = drawn.length - 1;

  return (
    <svg
      width="100%"
      height={height}
      role="img"
      aria-label={label}
      className="block overflow-visible rtl:-scale-x-100"
    >
      <rect width="100%" height={height} rx={2} className="fill-surface-muted" />
      {drawn.map((d, k) => (
        <g key={k}>
          <rect
            x={`${d.x}%`}
            width={`${d.w}%`}
            height={height}
            rx={k === last ? 4 : 0}
            className={d.className}
          />
          {/* Square the baseline side of the rounded last segment. */}
          {k === last && <rect x={`${d.x}%`} width={4} height={height} className={d.className} />}
          {k > 0 && <rect x={`${d.x}%`} width={2} height={height} className="fill-surface" />}
        </g>
      ))}
    </svg>
  );
}
