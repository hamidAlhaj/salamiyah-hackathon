import { fundingSegments } from './funding';

/** Live updates slide each segment to its new width (instant when reduced motion is asked for). */
const GROW = 'transition-[width] duration-700 ease-out motion-reduce:transition-none';

const DEMO_STRIPES =
  'bg-[repeating-linear-gradient(135deg,rgb(var(--text-muted)/0.45)_0_4px,transparent_4px_8px)]';

/**
 * Funding progress in three segments: verified money (solid), received but pending verification
 * (light), and simulated «Demo» payments (striped, never counted as verified). The percentage shown is
 * the verified share only. Grows from the reading start (right in RTL).
 */
export function FundingBar({
  target,
  verified,
  pending,
  demo,
  label,
  legend,
  size = 'md',
}: {
  target: string;
  verified: string;
  pending: string;
  demo: string;
  /** Accessible name, already translated. */
  label: string;
  /** Translated legend labels; omit to hide the legend. */
  legend?: { verified: string; pending: string; demo: string };
  size?: 'sm' | 'md';
}) {
  const s = fundingSegments({ target, verified, pending, demo });
  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, s.verifiedPercent)}
          aria-valuetext={`${s.verifiedPercent}%`}
          className={`flex flex-1 overflow-hidden rounded-full bg-track ${size === 'sm' ? 'h-2' : 'h-3'}`}
        >
          <span
            className={`h-full animate-grow bg-give-600 ltr:origin-left rtl:origin-right dark:bg-give-500 ${GROW}`}
            style={{ width: `${s.verified}%` }}
            data-segment="verified"
          />
          <span
            className={`h-full bg-give-300 dark:bg-give-700 ${GROW}`}
            style={{ width: `${s.pending}%` }}
            data-segment="pending"
          />
          <span
            className={`h-full ${DEMO_STRIPES} ${GROW}`}
            style={{ width: `${s.demo}%` }}
            data-segment="demo"
          />
        </div>
        <span className="min-w-[3rem] text-end text-sm font-semibold tabular-nums" dir="ltr">
          {s.verifiedPercent}%
        </span>
      </div>
      {legend && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-give-600 dark:bg-give-500"
            />
            {legend.verified}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-give-300 dark:bg-give-700"
            />
            {legend.pending}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${DEMO_STRIPES} ring-1 ring-border`}
            />
            {legend.demo}
          </li>
        </ul>
      )}
    </div>
  );
}
