/**
 * From mobile/.env (EXPO_PUBLIC_*, inlined at bundle time). On a real phone these must be the PC's LAN
 * address: localhost would point at the phone itself.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'http://localhost:3000';
