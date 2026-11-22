import { useId } from 'react';
import type { CoverKey } from '@/shared';

/*
 * Campaign covers are illustrations, never photos of people (CLAUDE.md). Each key of COVER_KEYS has one
 * flat geometric vignette drawn with theme tokens, so it follows light and dark mode. People appear only
 * as abstract shapes. Unknown keys fall back to the general cover.
 */

const SKY = 'fill-accent-soft';
const INK = 'fill-brand-700 dark:fill-brand-300';
const MID = 'fill-brand-500 dark:fill-brand-500';
const SOFT = 'fill-brand-200 dark:fill-brand-800';
const PAPER = 'fill-surface';
const LINE = 'stroke-brand-700 dark:stroke-brand-300';

function Ground() {
  return <path className={SOFT} d="M0 196c70-18 150-22 220-12s130 8 180-6v62H0z" />;
}

const SCENES: Record<CoverKey, React.ReactNode> = {
  'medical-1': (
    <>
      <Ground />
      <path
        className={MID}
        d="M200 186s-62-38-62-86a34 34 0 0 1 62-19 34 34 0 0 1 62 19c0 48-62 86-62 86z"
      />
      <path
        className={LINE}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M120 118h44l14-24 20 46 16-30 10 8h56"
      />
    </>
  ),
  'medical-2': (
    <>
      <Ground />
      <rect className={PAPER} x="148" y="62" width="104" height="124" rx="10" />
      <rect className={MID} x="188" y="86" width="24" height="64" rx="4" />
      <rect className={MID} x="168" y="106" width="64" height="24" rx="4" />
      <rect className={SOFT} x="168" y="160" width="64" height="8" rx="4" />
    </>
  ),
  'orphans-1': (
    <>
      <Ground />
      <circle className={INK} cx="168" cy="96" r="16" />
      <path className={INK} d="M144 180c0-30 10-56 24-56s24 26 24 56z" />
      <circle className={MID} cx="232" cy="110" r="13" />
      <path className={MID} d="M213 182c0-24 8-46 19-46s19 22 19 46z" />
      <path
        className={LINE}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        d="M186 148q23 -14 33 0"
      />
    </>
  ),
  'orphans-2': (
    <>
      <Ground />
      <path className={MID} d="M250 52l34 30-34 30-34-30z" />
      <path
        className={LINE}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        d="M250 112q-30 40-74 52"
      />
      <circle className={INK} cx="164" cy="140" r="12" />
      <path className={INK} d="M146 192c0-22 8-40 18-40s18 18 18 40z" />
    </>
  ),
  'home-1': (
    <>
      <Ground />
      <rect className={PAPER} x="132" y="104" width="136" height="88" />
      <path className={INK} d="M116 112l84-58 84 58z" />
      <path className={MID} d="M152 92l24-16 0 26z" />
      <rect className={MID} x="186" y="140" width="28" height="52" rx="3" />
      <rect className={SOFT} x="146" y="124" width="24" height="22" rx="2" />
      <rect className={SOFT} x="230" y="124" width="24" height="22" rx="2" />
    </>
  ),
  'home-2': (
    <>
      <Ground />
      <rect className={PAPER} x="120" y="112" width="120" height="80" />
      <path className={INK} d="M106 120l74-50 74 50z" />
      <g className={MID}>
        <rect x="256" y="160" width="34" height="14" rx="2" />
        <rect x="274" y="176" width="34" height="14" rx="2" />
        <rect x="238" y="176" width="34" height="14" rx="2" />
      </g>
      <path
        className={LINE}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        d="M300 120l-26 26"
      />
      <rect className={MID} x="164" y="140" width="32" height="52" rx="3" />
    </>
  ),
  'community-1': (
    <>
      <Ground />
      <path className={INK} d="M120 140h160l-14 52H134z" />
      <path
        className={LINE}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        d="M150 140l30-44M250 140l-30-44"
      />
      <circle className={MID} cx="170" cy="128" r="14" />
      <circle className={SOFT} cx="200" cy="122" r="16" />
      <circle className={MID} cx="232" cy="128" r="13" />
    </>
  ),
  'general-1': (
    <>
      <Ground />
      <g className={INK} transform="translate(200 116)">
        <rect x="-44" y="-44" width="88" height="88" rx="6" />
        <rect x="-44" y="-44" width="88" height="88" rx="6" transform="rotate(45)" />
      </g>
      <circle className={PAPER} cx="200" cy="116" r="22" />
    </>
  ),
};

export function CampaignCover({
  coverKey,
  className = '',
}: {
  coverKey: string | null;
  className?: string;
}) {
  const pattern = useId();
  const scene = SCENES[(coverKey ?? 'general-1') as CoverKey] ?? SCENES['general-1'];
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      className={`block h-full w-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={pattern} width="44" height="44" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--lattice-soft)" strokeWidth="1.2">
            <rect x="13" y="13" width="18" height="18" />
            <rect x="13" y="13" width="18" height="18" transform="rotate(45 22 22)" />
          </g>
        </pattern>
      </defs>
      <rect className={SKY} width="400" height="240" />
      <rect width="400" height="240" fill={`url(#${pattern})`} />
      {scene}
    </svg>
  );
}
