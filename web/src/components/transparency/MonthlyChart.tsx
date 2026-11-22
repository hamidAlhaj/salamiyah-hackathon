import { formatMoney, numberLocale, type TransparencyMonth } from '@/shared';
import { monthlyLayout } from './chart-geometry';

export interface MonthlyLabels {
  title: string;
  desc: string;
  collected: string;
  spent: string;
  table: string;
  month: string;
}

interface Variant {
  id: string;
  width: number;
  height: number;
  axis: number;
  /** Label every n-th month, counted back from the latest. */
  every: number;
  className: string;
}

/** Phones get a narrow drawing so its 13px labels stay 13px; wider screens get the full one. */
const VARIANTS: Variant[] = [
  { id: 'narrow', width: 360, height: 250, axis: 58, every: 3, className: 'sm:hidden' },
  { id: 'wide', width: 960, height: 300, axis: 72, every: 2, className: 'hidden sm:block' },
];

/**
 * 12 months of verified money vs spending as paired columns, server-rendered SVG. One value axis,
 * recessive 1px gridlines, a legend, a native hover title per month and a table fallback.
 */
export function MonthlyChart({
  months,
  locale,
  labels,
}: {
  months: TransparencyMonth[];
  locale: 'ar' | 'en';
  labels: MonthlyLabels;
}) {
  const rtl = locale === 'ar';
  const rows = months.map((m) => ({
    collected: Number(m.verifiedAmount),
    spent: Number(m.spentAmount),
  }));
  const dateLocale = locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-US';
  const monthDate = (ym: string) => new Date(`${ym}-01T00:00:00Z`);
  const short = new Intl.DateTimeFormat(dateLocale, { month: 'short', timeZone: 'UTC' });
  const long = new Intl.DateTimeFormat(dateLocale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const compact = new Intl.NumberFormat(numberLocale(locale), {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const money = (v: string) => formatMoney(v, 'SYP', locale);

  return (
    <div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[3px] bg-series-collected" />
          {labels.collected}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[3px] bg-series-spent" />
          {labels.spent}
        </li>
      </ul>

      {VARIANTS.map((v) => {
        const layout = monthlyLayout(rows, { width: v.width, height: v.height, rtl, axis: v.axis });
        const band = (layout.plot.right - layout.plot.left) / Math.max(1, rows.length);
        const labelX = rtl ? layout.plot.right + 10 : layout.plot.left - 10;
        return (
          <svg
            key={v.id}
            viewBox={`0 0 ${v.width} ${v.height}`}
            role="img"
            aria-labelledby={`monthly-${v.id}-title monthly-${v.id}-desc`}
            className={`mt-4 h-auto w-full ${v.className}`}
            data-testid={`monthly-chart-${v.id}`}
          >
            <title id={`monthly-${v.id}-title`}>{labels.title}</title>
            <desc id={`monthly-${v.id}-desc`}>{labels.desc}</desc>
            {layout.grid.map((g) => (
              <g key={g.value}>
                <line
                  x1={layout.plot.left}
                  x2={layout.plot.right}
                  y1={g.y}
                  y2={g.y}
                  className={g.value === 0 ? 'stroke-control' : 'stroke-border'}
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <text
                  x={labelX}
                  y={g.y}
                  dy="0.35em"
                  textAnchor={rtl ? 'start' : 'end'}
                  className="fill-muted"
                  fontSize={13}
                  direction="ltr"
                >
                  {compact.format(g.value)}
                </text>
              </g>
            ))}
            {layout.bands.map((b, i) => {
              const m = months[i];
              const labelled = (rows.length - 1 - i) % v.every === 0;
              return (
                <g key={m.month} data-month={m.month}>
                  {b.collected.path && (
                    <path d={b.collected.path} className="fill-series-collected" />
                  )}
                  {b.spent.path && <path d={b.spent.path} className="fill-series-spent" />}
                  {labelled && (
                    <text
                      x={b.center}
                      y={layout.plot.bottom + 21}
                      textAnchor="middle"
                      className="fill-muted"
                      fontSize={13}
                    >
                      {short.format(monthDate(m.month))}
                    </text>
                  )}
                  {/* The hover target is the whole month column, larger than the bars. */}
                  <rect
                    x={b.center - band / 2}
                    y={layout.plot.top}
                    width={band}
                    height={layout.plot.bottom - layout.plot.top}
                    fill="transparent"
                  >
                    <title>
                      {`${long.format(monthDate(m.month))}\n${labels.collected}: ${money(m.verifiedAmount)}\n${labels.spent}: ${money(m.spentAmount)}`}
                    </title>
                  </rect>
                </g>
              );
            })}
          </svg>
        );
      })}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer rounded font-semibold text-accent hover:underline">
          {labels.table}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-start text-sm" data-testid="monthly-table">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 text-start font-medium">
                  {labels.month}
                </th>
                <th scope="col" className="py-2 text-end font-medium">
                  {labels.collected}
                </th>
                <th scope="col" className="py-2 text-end font-medium">
                  {labels.spent}
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-border/60" data-month={m.month}>
                  <th scope="row" className="py-1.5 text-start font-normal">
                    {long.format(monthDate(m.month))}
                  </th>
                  <td className="py-1.5 text-end tabular-nums" data-value={m.verifiedAmount}>
                    {money(m.verifiedAmount)}
                  </td>
                  <td className="py-1.5 text-end tabular-nums" data-value={m.spentAmount}>
                    {money(m.spentAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
