/**
 * The page to return to after login. Only in-app paths of known shapes are accepted, so a crafted
 * `?next=` can never redirect off-site (no `//host`, no scheme, no backslashes).
 */
const ALLOWED_NEXT = [
  /^\/campaigns\/[a-z0-9_-]{3,60}(\/donate)?$/,
  /^\/dashboard(\/[a-z-]{2,30})?$/,
];

export function safeNextPath(value: string): string | undefined {
  return ALLOWED_NEXT.some((re) => re.test(value)) ? value : undefined;
}
