/**
 * Progress toward a goal. The fill clamps at 100%, the label shows the real (floored) percentage.
 * The fill grows from the reading start (right in RTL); with reduced motion it simply appears.
 */
export function ProgressBar({
  value,
  max,
  label,
  tone = 'give',
}: {
  value: number;
  max: number;
  /** Accessible name, already translated by the caller. */
  label: string;
  /** `give` for funding progress; `brand` for other measures. */
  tone?: 'give' | 'brand';
}) {
  // Floor so a campaign is never shown as 100% before it actually reaches its goal.
  const percent = max > 0 ? Math.floor((Math.max(0, value) / max) * 100) : 0;
  const fill = Math.min(100, percent);
  const fillColor =
    tone === 'give' ? 'bg-give-600 dark:bg-give-500' : 'bg-brand-600 dark:bg-brand-400';

  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        aria-valuetext={`${percent}%`}
        className="h-3 flex-1 overflow-hidden rounded-full bg-track"
      >
        <div
          className={`h-full animate-grow rounded-full transition-[width] duration-700 ease-out ltr:origin-left rtl:origin-right ${fillColor}`}
          style={{ width: `${fill}%` }}
        />
      </div>
      <span className="min-w-[3rem] text-end text-sm font-semibold tabular-nums" dir="ltr">
        {percent}%
      </span>
    </div>
  );
}
