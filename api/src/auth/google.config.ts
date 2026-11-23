import type { ConfigService } from '@nestjs/config';
import type { GoogleSignInConfig } from '../common/shared';

/** The Google OAuth client (api/.env). Sign in with Google is off unless all three are set. */
export interface GoogleSettings {
  clientID: string;
  clientSecret: string;
  /** The web route Google redirects back to, e.g. http://localhost:3000/auth/google/callback. */
  callbackURL: string;
}

export function googleSettings(config: ConfigService): GoogleSettings | null {
  const clientID = config.get<string>('GOOGLE_CLIENT_ID')?.trim();
  const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
  const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL')?.trim();
  if (!clientID || !clientSecret || !callbackURL || !callbackOrigin(callbackURL)) return null;
  return { clientID, clientSecret, callbackURL };
}

/** What the web may know: on/off and the callback origin (never the client id or secret). */
export function googlePublicConfig(config: ConfigService): GoogleSignInConfig {
  const settings = googleSettings(config);
  return {
    enabled: settings !== null,
    callbackOrigin: settings ? callbackOrigin(settings.callbackURL) : null,
  };
}

function callbackOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : null;
  } catch {
    return null;
  }
}

/**
 * The CSRF state the web creates per sign-in (kept in its own HttpOnly cookie and compared on the
 * callback). The API only passes it through to Google, so it accepts URL-safe random strings only.
 */
export const GOOGLE_STATE_REGEX = /^[A-Za-z0-9_-]{32,128}$/;
