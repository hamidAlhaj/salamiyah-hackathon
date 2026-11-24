import { sessionCookieSecure } from './cookie-secure';

describe('sessionCookieSecure', () => {
  it('defaults to Secure in production and not in development', () => {
    expect(sessionCookieSecure(undefined, 'production')).toBe(true);
    expect(sessionCookieSecure(undefined, 'development')).toBe(false);
    expect(sessionCookieSecure('', 'production')).toBe(true);
  });

  it('lets an explicit "false" turn it off for the plain-HTTP LAN demo', () => {
    expect(sessionCookieSecure('false', 'production')).toBe(false);
    expect(sessionCookieSecure(' FALSE ', 'production')).toBe(false);
  });

  it('lets an explicit "true" turn it on outside production', () => {
    expect(sessionCookieSecure('true', 'development')).toBe(true);
  });

  it('ignores other values and keeps the default', () => {
    expect(sessionCookieSecure('no', 'production')).toBe(true);
    expect(sessionCookieSecure('1', 'development')).toBe(false);
  });
});
