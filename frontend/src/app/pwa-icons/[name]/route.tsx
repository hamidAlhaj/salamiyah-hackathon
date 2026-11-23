import { ImageResponse } from 'next/og';

/** PNG install icons for the manifest, rendered at build time from the app/icon.svg mark. */
const ICONS: Record<string, { size: number; maskable: boolean }> = {
  '192': { size: 192, maskable: false },
  '512': { size: 512, maskable: false },
  // Maskable: full-bleed background, mark inside the central safe zone.
  'maskable-512': { size: 512, maskable: true },
};

export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

/** The Majlis Fund mark (eight-point star + pulse line) in white on council green. */
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round">
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

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const icon = ICONS[(await params).name];
  if (!icon) return new Response('Not found', { status: 404 });
  const mark = Math.round(icon.size * (icon.maskable ? 0.72 : 1));
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f3d2a',
        borderRadius: icon.maskable ? 0 : icon.size * 0.25,
      }}
    >
      <Mark size={mark} />
    </div>,
    { width: icon.size, height: icon.size },
  );
}
