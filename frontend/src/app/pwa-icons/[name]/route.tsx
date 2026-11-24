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

/** The Athar mark (docs/brand/athar-icon.png), embedded as a data URI for the image renderer. */
const MARK = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/brand/athar-icon.png')).toString('base64')}`;

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
        // Maskable icons need a full-bleed background; the mark carries its own rounded tile.
        background: icon.maskable ? '#15803D' : 'transparent',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
      <img src={MARK} width={mark} height={mark} alt="" />
    </div>,
    { width: icon.size, height: icon.size },
  );
}
