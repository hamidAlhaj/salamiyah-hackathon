const createNextIntlPlugin = require('next-intl/plugin');

// next-intl reads its per-request config from src/i18n/request.ts (cookie locale, no routing).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server Actions keep Next's default same-origin protection; do not widen allowedOrigins.
};

module.exports = withNextIntl(nextConfig);
