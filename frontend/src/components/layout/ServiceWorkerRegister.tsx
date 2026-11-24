'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js (the offline fallback page) in production builds on secure origins only:
 * HTTPS, or http://localhost. Plain-HTTP LAN addresses are not secure contexts, so there the site
 * simply works without the offline page (see README "Install the collector app").
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !window.isSecureContext ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Not critical: the site works the same without the offline page.
    });
  }, []);
  return null;
}
