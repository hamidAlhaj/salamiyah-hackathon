/**
 * Majlis Fund mark: an eight-point star (two interlaced squares, the geometric star found in
 * Salamiyah's old stonework) on the deep council-green tile, with a pulse line running through it
 * for the medical mission. The same lattice star repeats in StarLattice.
 */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" className="fill-panel" />
      <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" opacity="0.92">
        <rect x="13" y="13" width="22" height="22" rx="1.5" />
        <rect x="13" y="13" width="22" height="22" rx="1.5" transform="rotate(45 24 24)" />
      </g>
      <path
        d="M9 25h8l2.5-5 4 10 3-7 1.5 2H39"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mark + Kufi wordmark. The wordmark is always Arabic (lang="ar"), whatever the UI language. */
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
        مجلس فند
      </span>
    </span>
  );
}
