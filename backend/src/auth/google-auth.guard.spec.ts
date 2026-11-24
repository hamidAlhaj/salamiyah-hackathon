import {
  BadRequestException,
  ConflictException,
  type ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './google-auth.guard';
import { googlePublicConfig, googleSettings } from './google.config';

const FULL = {
  GOOGLE_CLIENT_ID: 'test-client-id',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
};

const config = (env: Record<string, string | undefined>) =>
  ({ get: (key: string) => env[key] }) as unknown as ConfigService;

const context = (query: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ query }) }),
  }) as unknown as ExecutionContext;

describe('Google sign-in configuration', () => {
  it('is on only when all three GOOGLE_* keys are set', () => {
    expect(googleSettings(config(FULL))).toEqual({
      clientID: 'test-client-id',
      clientSecret: 'test-client-secret',
      callbackURL: 'http://localhost:3000/auth/google/callback',
    });
    for (const key of Object.keys(FULL)) {
      expect(googleSettings(config({ ...FULL, [key]: '' }))).toBeNull();
      expect(googleSettings(config({ ...FULL, [key]: undefined }))).toBeNull();
    }
  });

  it('is off for a callback that is not an http(s) URL', () => {
    expect(googleSettings(config({ ...FULL, GOOGLE_CALLBACK_URL: 'not a url' }))).toBeNull();
    expect(googleSettings(config({ ...FULL, GOOGLE_CALLBACK_URL: 'ftp://x/cb' }))).toBeNull();
  });

  it('tells the web only on/off and the callback origin, never the client id or secret', () => {
    expect(googlePublicConfig(config({}))).toEqual({ enabled: false, callbackOrigin: null });
    const on = googlePublicConfig(config(FULL));
    expect(on).toEqual({ enabled: true, callbackOrigin: 'http://localhost:3000' });
    expect(JSON.stringify(on)).not.toMatch(/test-client/);
  });
});

describe('GoogleAuthGuard', () => {
  it('answers 404 google_sign_in_disabled when Google is not configured', () => {
    const guard = new GoogleAuthGuard(config({}));
    expect(() => guard.canActivate(context({ state: 'S'.repeat(40) }))).toThrow(
      new NotFoundException('google_sign_in_disabled'),
    );
    expect(() => guard.canActivate(context({ code: 'c' }))).toThrow(NotFoundException);
  });

  it.each([
    {},
    { state: 'short' },
    { state: 'has spaces and !'.repeat(3) },
    { state: ['a', 'b'] },
  ])('refuses to start without a valid CSRF state (%j)', (query) => {
    const guard = new GoogleAuthGuard(config(FULL));
    expect(() => guard.canActivate(context(query))).toThrow(
      new BadRequestException('google_state_required'),
    );
  });

  it('passes a valid state to Google, without sessions, with the account chooser', () => {
    const guard = new GoogleAuthGuard(config(FULL));
    const state = 'abc_DEF-123'.repeat(4);
    expect(guard.getAuthenticateOptions(context({ state }))).toEqual({
      session: false,
      prompt: 'select_account',
      state,
    });
    expect(guard.getAuthenticateOptions(context({ state: 'x' })).state).toBeUndefined();
  });

  it('keeps our own refusals and turns any other failure into google_sign_in_failed', () => {
    const guard = new GoogleAuthGuard(config(FULL));
    const mismatch = new ConflictException('google_account_mismatch');
    expect(() => guard.handleRequest(mismatch, false)).toThrow(mismatch);
    expect(() => guard.handleRequest(new Error('token endpoint down'), false)).toThrow(
      new UnauthorizedException('google_sign_in_failed'),
    );
    expect(() => guard.handleRequest(null, false)).toThrow(UnauthorizedException);
    expect(guard.handleRequest(null, { accessToken: 't' })).toEqual({ accessToken: 't' });
  });
});
