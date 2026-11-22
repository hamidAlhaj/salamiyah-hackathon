import { SITE_URL } from './config';

/** Where a notification link takes the donor on the phone. */
export type LinkTarget = { kind: 'screen'; href: string } | { kind: 'web'; url: string };

/**
 * Notifications store web paths (api/src/notifications/links.ts, the same patterns). The app maps
 * each one to its own screen; the official receipt page opens in the browser. Unknown links → null.
 */
export function resolveLink(link: string | null): LinkTarget | null {
  if (!link) return null;
  if (link === '/dashboard/donations') return { kind: 'screen', href: '/donations' };
  const campaign = /^\/campaigns\/([a-z0-9_-]{3,60})$/.exec(link);
  if (campaign) return { kind: 'screen', href: `/campaign/${campaign[1]}` };
  if (/^\/receipts\/R-\d{4}-\d{6}$/.test(link)) return { kind: 'web', url: `${SITE_URL}${link}` };
  return null;
}
