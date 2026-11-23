import { toString } from 'qrcode';

/**
 * A QR code as an inline SVG string (server-side, no client JS). Dark council-green modules on white
 * with a quiet zone, error correction M: scannable on paper and on a phone screen in dark mode too,
 * because the code keeps its own white background.
 */
export function qrSvg(text: string): Promise<string> {
  return toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#0f3d2aff', light: '#ffffffff' },
  });
}
