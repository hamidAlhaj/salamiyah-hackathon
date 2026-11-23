/**
 * Whether the session cookie gets the `Secure` flag. SESSION_COOKIE_SECURE="true" / "false" decides
 * explicitly; otherwise it is on in production and off in development. The LAN demo serves a
 * production build over plain HTTP (http://<LAN-IP>:3000), where browsers drop a Secure cookie and
 * login silently fails, so it sets SESSION_COOKIE_SECURE="false". Keep the default anywhere HTTPS is used.
 */
export function sessionCookieSecure(
  explicit: string | undefined,
  nodeEnv: string | undefined,
): boolean {
  const value = explicit?.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return nodeEnv === 'production';
}
