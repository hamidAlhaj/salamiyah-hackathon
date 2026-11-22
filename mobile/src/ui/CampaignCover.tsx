import { type ReactNode, useId } from 'react';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import type { CoverKey } from '@/shared';
import { type Palette, usePalette } from './theme';

/*
 * Campaign covers are illustrations, never photos of people (CLAUDE.md). The same flat vignettes as
 * web/src/components/campaigns/CampaignCover.tsx, one per COVER_KEYS entry, drawn with the theme
 * palette so they follow light and dark mode. Unknown keys fall back to the general cover.
 */

type Scene = (c: Palette) => ReactNode;

const ground: Scene = (c) => (
  <Path fill={c.coverSoft} d="M0 196c70-18 150-22 220-12s130 8 180-6v62H0z" />
);

const SCENES: Record<CoverKey, Scene> = {
  'medical-1': (c) => (
    <>
      {ground(c)}
      <Path
        fill={c.coverMid}
        d="M200 186s-62-38-62-86a34 34 0 0 1 62-19 34 34 0 0 1 62 19c0 48-62 86-62 86z"
      />
      <Path
        stroke={c.coverInk}
        fill="none"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M120 118h44l14-24 20 46 16-30 10 8h56"
      />
    </>
  ),
  'medical-2': (c) => (
    <>
      {ground(c)}
      <Rect fill={c.surface} x={148} y={62} width={104} height={124} rx={10} />
      <Rect fill={c.coverMid} x={188} y={86} width={24} height={64} rx={4} />
      <Rect fill={c.coverMid} x={168} y={106} width={64} height={24} rx={4} />
      <Rect fill={c.coverSoft} x={168} y={160} width={64} height={8} rx={4} />
    </>
  ),
  'orphans-1': (c) => (
    <>
      {ground(c)}
      <Circle fill={c.coverInk} cx={168} cy={96} r={16} />
      <Path fill={c.coverInk} d="M144 180c0-30 10-56 24-56s24 26 24 56z" />
      <Circle fill={c.coverMid} cx={232} cy={110} r={13} />
      <Path fill={c.coverMid} d="M213 182c0-24 8-46 19-46s19 22 19 46z" />
      <Path
        stroke={c.coverInk}
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        d="M186 148q23 -14 33 0"
      />
    </>
  ),
  'orphans-2': (c) => (
    <>
      {ground(c)}
      <Path fill={c.coverMid} d="M250 52l34 30-34 30-34-30z" />
      <Path
        stroke={c.coverInk}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        d="M250 112q-30 40-74 52"
      />
      <Circle fill={c.coverInk} cx={164} cy={140} r={12} />
      <Path fill={c.coverInk} d="M146 192c0-22 8-40 18-40s18 18 18 40z" />
    </>
  ),
  'home-1': (c) => (
    <>
      {ground(c)}
      <Rect fill={c.surface} x={132} y={104} width={136} height={88} />
      <Path fill={c.coverInk} d="M116 112l84-58 84 58z" />
      <Path fill={c.coverMid} d="M152 92l24-16 0 26z" />
      <Rect fill={c.coverMid} x={186} y={140} width={28} height={52} rx={3} />
      <Rect fill={c.coverSoft} x={146} y={124} width={24} height={22} rx={2} />
      <Rect fill={c.coverSoft} x={230} y={124} width={24} height={22} rx={2} />
    </>
  ),
  'home-2': (c) => (
    <>
      {ground(c)}
      <Rect fill={c.surface} x={120} y={112} width={120} height={80} />
      <Path fill={c.coverInk} d="M106 120l74-50 74 50z" />
      <G fill={c.coverMid}>
        <Rect x={256} y={160} width={34} height={14} rx={2} />
        <Rect x={274} y={176} width={34} height={14} rx={2} />
        <Rect x={238} y={176} width={34} height={14} rx={2} />
      </G>
      <Path
        stroke={c.coverInk}
        fill="none"
        strokeWidth={6}
        strokeLinecap="round"
        d="M300 120l-26 26"
      />
      <Rect fill={c.coverMid} x={164} y={140} width={32} height={52} rx={3} />
    </>
  ),
  'community-1': (c) => (
    <>
      {ground(c)}
      <Path fill={c.coverInk} d="M120 140h160l-14 52H134z" />
      <Path
        stroke={c.coverInk}
        fill="none"
        strokeWidth={6}
        strokeLinecap="round"
        d="M150 140l30-44M250 140l-30-44"
      />
      <Circle fill={c.coverMid} cx={170} cy={128} r={14} />
      <Circle fill={c.coverSoft} cx={200} cy={122} r={16} />
      <Circle fill={c.coverMid} cx={232} cy={128} r={13} />
    </>
  ),
  'general-1': (c) => (
    <>
      {ground(c)}
      <G fill={c.coverInk} transform="translate(200 116)">
        <Rect x={-44} y={-44} width={88} height={88} rx={6} />
        <Rect x={-44} y={-44} width={88} height={88} rx={6} transform="rotate(45)" />
      </G>
      <Circle fill={c.surface} cx={200} cy={116} r={22} />
    </>
  ),
};

export function CampaignCover({ coverKey, height }: { coverKey: string | null; height: number }) {
  const c = usePalette();
  const pattern = `lattice${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const scene = SCENES[(coverKey ?? 'general-1') as CoverKey] ?? SCENES['general-1'];
  return (
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <Defs>
        <Pattern id={pattern} width={44} height={44} patternUnits="userSpaceOnUse">
          <G fill="none" stroke={c.coverInk} strokeOpacity={0.08} strokeWidth={1.2}>
            <Rect x={13} y={13} width={18} height={18} />
            <Rect x={13} y={13} width={18} height={18} transform="rotate(45 22 22)" />
          </G>
        </Pattern>
      </Defs>
      <Rect fill={c.coverSky} width={400} height={240} />
      <Rect width={400} height={240} fill={`url(#${pattern})`} />
      {scene(c)}
    </Svg>
  );
}
