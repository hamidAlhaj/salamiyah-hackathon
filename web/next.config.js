const createNextIntlPlugin = require('next-intl/plugin');

// next-intl reads its per-request config from src/i18n/request.ts (cookie locale, no routing).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions keep Next's default same-origin protection (allowedOrigins is not widened).
    // Uploads pass through Server Actions: medical reports ≤ 5 MB, import files ≤ 10 MB (API limits).
    serverActions: { bodySizeLimit: '11mb' },
  },
};

module.exports = withNextIntl(nextConfig);
