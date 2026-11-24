import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy } from 'passport-google-oauth20';
import type { AuthResponse } from '../common/shared';
import type { GoogleSettings } from './google.config';
import type { GoogleAuthService, GoogleIdentity } from './google-auth.service';

/**
 * passport-google-oauth20 under the name "google". Registered only when the three GOOGLE_* keys are
 * set (see the factory in AuthModule). The browser never talks to the API in this flow: the web
 * route handler fetches the redirect to Google and later hands over Google's one-time code; this
 * strategy exchanges it, and `validate` returns the app session for the controller to send back.
 */
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    settings: GoogleSettings,
    private readonly google: GoogleAuthService,
  ) {
    super({
      clientID: settings.clientID,
      clientSecret: settings.clientSecret,
      callbackURL: settings.callbackURL,
      scope: ['openid', 'email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<AuthResponse> {
    return this.google.signIn(googleIdentity(profile));
  }
}

/** The parts of a Google profile the app uses. Only a Google-verified email is kept. */
export function googleIdentity(profile: Profile): GoogleIdentity {
  const json = profile._json ?? ({} as Partial<Profile['_json']>);
  const verifiedEmail =
    (json.email && json.email_verified === true ? json.email : undefined) ??
    profile.emails?.find((e) => e.verified)?.value;
  const name = (profile.displayName || json.name || '').trim();
  return {
    sub: profile.id,
    email: verifiedEmail ? verifiedEmail.trim().toLowerCase() : null,
    name: name || null,
    locale: json.locale?.toLowerCase().startsWith('en') ? 'en' : 'ar',
  };
}
