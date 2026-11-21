import { useId } from 'react';

/**
 * The brand's one bold element: a repeating eight-point-star lattice (khatam pattern) drawn in
 * the current text colour at low opacity. Purely decorative; absolutely positioned by the parent.
 */
export function StarLattice({
  className = '',
  tone = 'panel',
}: {
  className?: string;
  /** `panel` on the deep-green brand panel, `soft` on light/dark page surfaces. */
  tone?: 'panel' | 'soft';
}) {
  const id = useId();
  const stroke = tone === 'panel' ? 'var(--lattice)' : 'var(--lattice-soft)';
  return (
    <svg className={`pointer-events-none ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={stroke} strokeWidth="1.25">
            <rect x="16" y="16" width="24" height="24" />
            <rect x="16" y="16" width="24" height="24" transform="rotate(45 28 28)" />
            <path d="M0 28h11M45 28h11M28 0v11M28 45v11" />
            <circle cx="28" cy="28" r="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
