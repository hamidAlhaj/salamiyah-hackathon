import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/** PNG install icons for the manifest, rendered at build time from the Athar mark. */
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

/** Athar app icons (docs/brand), embedded as data URIs for the image renderer. */
const dataUri = (file: string) =>
  `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/brand', file)).toString('base64')}`;
/** The green app icon (rounded tile) for the regular icons. */
const TILE = dataUri('athar-icon-green.png');
/** The white-word logo without its tile, for the full-bleed maskable icon. */
const MARK = dataUri('athar-icon-dark.png');

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
        // Maskable icons need a full-bleed background (the tile colour) with the logo in the safe zone.
        background: icon.maskable ? '#0B3D2A' : 'transparent',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
      <img src={icon.maskable ? MARK : TILE} width={mark} height={mark} alt="" />
    </div>,
    { width: icon.size, height: icon.size },
  );
}
