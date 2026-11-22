import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { CategoryIcon as CategoryIconKey } from '@/shared';

/** The same 24px stroke icons as web/src/components/campaigns/CategoryIcon.tsx (CATEGORY_ICONS keys). */
const PATHS: Record<CategoryIconKey, ReactNode> = {
  'heart-pulse': (
    <>
      <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      <Path d="M6.5 12h3l1.5-2.5 2 4 1.5-1.5h3" />
    </>
  ),
  child: (
    <>
      <Circle cx={12} cy={6} r={2.5} />
      <Path d="M8 21v-5l-2-3 3-3h6l3 3-2 3v5M10 21v-4h4v4" />
    </>
  ),
  home: (
    <>
      <Path d="M3.5 11 12 4l8.5 7" />
      <Path d="M5.5 9.5V20h13V9.5M10 20v-5h4v5" />
    </>
  ),
  hands: (
    <>
      <Path d="M4 14l4-3 3 2 2-1 3 2-4 4H7l-3-4z" />
      <Path d="M12 9.5 14.5 7a1.8 1.8 0 0 0-2.5-2.5L12 4.6l-.1-.1A1.8 1.8 0 0 0 9.5 7z" />
    </>
  ),
  book: (
    <>
      <Path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z" />
      <Path d="M12 5.5V19" />
    </>
  ),
  basket: (
    <>
      <Path d="M3.5 10h17l-2 9.5h-13z" />
      <Path d="M8 10l3-5M16 10l-3-5M9 13.5v3M12 13.5v3M15 13.5v3" />
    </>
  ),
  water: <Path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" />,
  sun: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  users: (
    <>
      <Circle cx={9} cy={8} r={3} />
      <Path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.6M17.5 14a5 5 0 0 1 3 5" />
    </>
  ),
  star: (
    <>
      <Rect x={6.5} y={6.5} width={11} height={11} />
      <Rect x={6.5} y={6.5} width={11} height={11} transform="rotate(45 12 12)" />
    </>
  ),
};

/** Unknown keys (an older app seeing a new key) fall back to the brand star. */
export function CategoryIcon({
  icon,
  color,
  size = 18,
}: {
  icon: string;
  color: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[icon as CategoryIconKey] ?? PATHS.star}
    </Svg>
  );
}
