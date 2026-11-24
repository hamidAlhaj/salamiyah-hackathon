/* eslint-disable @next/next/no-img-element -- a small static SVG mark, no image optimisation needed */
/**
 * Athar («أثر») brand: the ripple mark (a drop and its widening rings: every donation leaves a trace)
 * on the green tile, from docs/brand/athar-icon.svg (served from /brand/). The mark reads on light
 * and dark surfaces alike; the wordmark follows the text colour.
 */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return <img src="/brand/athar-icon.svg" alt="" aria-hidden="true" className={className} />;
}

/** Mark + Kufi wordmark «أثر». The wordmark is always Arabic (lang="ar"), whatever the UI language. */
export function Logo({
  size = 'md',
  className = '',
  wordmarkClassName = '',
}: {
  size?: 'md' | 'lg';
  className?: string;
  /** e.g. `hidden sm:inline` to show only the mark on narrow headers. */
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'} />
      <span
        lang="ar"
        className={`whitespace-nowrap font-display font-bold leading-none ${size === 'lg' ? 'text-3xl' : 'text-xl'} ${wordmarkClassName}`}
      >
        أثر
      </span>
    </span>
  );
}
