import type { MetadataRoute } from 'next';

/**
 * Web app manifest (served at /manifest.webmanifest): the site is installable ("Add to Home
 * screen"), mainly for collectors at their collection points. It opens on the workspace home, which
 * shows each role its own screens; a shortcut leads collectors straight to their points.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'مجلس فند: تبرعات المجلس المحلي في السلمية',
    short_name: 'مجلس فند',
    description:
      'منصة المجلس المحلي في السلمية لحملات التبرع: كفالة أيتام وترميم منازل ومساعدات طبية بحساب مفتوح.',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#eef2ef',
    theme_color: '#0f3d2a',
    categories: ['finance', 'social'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/pwa-icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icons/maskable-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'نقاط الجمع', short_name: 'نقاط الجمع', url: '/dashboard/collector' },
      { name: 'الحملات', url: '/' },
    ],
  };
}
