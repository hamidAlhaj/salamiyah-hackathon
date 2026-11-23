/**
 * Links stored on notifications are web paths that exist (bug B2: the old `/pledges/:id` existed
 * nowhere). The web opens them as they are; the mobile app maps each pattern to its own screen
 * (mobile/src/lib/links.ts): my donations → /donations, a campaign → /campaign/:slug, an official
 * receipt → the web page in the browser. The spec checks both sides have these routes.
 */
export const links = {
  myDonations: () => '/dashboard/donations',
  campaign: (slug: string) => `/campaigns/${slug}`,
  officialReceipt: (receiptNo: string) => `/receipts/${receiptNo}`,
  /** Staff only (SLA alerts); the donor app never receives it. */
  staffCase: (caseId: string) => `/dashboard/cases/${caseId}`,
};

/** Every link a notification may carry matches exactly one of these. */
export const NOTIFICATION_LINK_PATTERNS: readonly RegExp[] = [
  /^\/dashboard\/donations$/,
  /^\/campaigns\/[a-z0-9_-]{3,60}$/,
  /^\/receipts\/R-\d{4}-\d{6}$/,
  /^\/dashboard\/cases\/[0-9a-f-]{36}$/,
];

export function isKnownLink(link: string): boolean {
  return NOTIFICATION_LINK_PATTERNS.some((re) => re.test(link));
}
