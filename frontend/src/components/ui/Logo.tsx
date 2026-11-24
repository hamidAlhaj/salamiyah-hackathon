/* eslint-disable @next/next/no-img-element -- small static SVG logos, no image optimisation needed */
/**
 * Athar («أثر») brand, final logo v2 (docs/brand/v2, served from /brand/): the word «أثر» in green
 * inside a gold ring with leaves and an open hand. The logo carries the wordmark itself.
 * - `auto`: green word on light surfaces, the white-word variant in dark mode (`dark:` class).
 * - `onDark`: always the white-word variant, for the deep-green brand panels (login, receipt);
 *   prints with the green word.
 */
export function LogoMark({
  className = 'h-11 w-11',
  tone = 'auto',
}: {
  className?: string;
  tone?: 'auto' | 'onDark';
}) {
  const light = tone === 'auto' ? 'dark:hidden' : 'hidden print:block';
  const dark = tone === 'auto' ? 'hidden dark:block' : 'print:hidden';
  return (
    <span className={`inline-flex shrink-0 ${className}`} aria-hidden="true">
      <img src="/brand/athar-icon.svg" alt="" className={`h-full w-full ${light}`} />
      <img src="/brand/athar-icon-dark.svg" alt="" className={`h-full w-full ${dark}`} />
    </span>
  );
}

/** The brand logo at header (`md`) or panel (`lg`) size. Wrap it in a link with the brand name. */
export function Logo({
  size = 'md',
  tone = 'auto',
  className = '',
}: {
  size?: 'md' | 'lg';
  tone?: 'auto' | 'onDark';
  className?: string;
}) {
  return (
    <LogoMark tone={tone} className={`${size === 'lg' ? 'h-24 w-24' : 'h-12 w-12'} ${className}`} />
  );
}
