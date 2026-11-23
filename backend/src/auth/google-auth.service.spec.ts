import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Role, User } from '@prisma/client';
import type { Request } from 'express';
import type { Profile } from 'passport-google-oauth20';
import type { AuditService } from '../audit/audit.service';
import type { AuthResponse } from '../common/shared';
import type { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthService } from './google-auth.service';
import type { GoogleSettings } from './google.config';
import { googleIdentity, GoogleStrategy } from './google.strategy';

// Mocked Google profiles, shaped like passport-google-oauth20's parsed userinfo (no real accounts).
function googleProfile(over: Partial<Profile['_json']> = {}): Profile {
  const json = {
    iss: 'https://accounts.google.com',
    aud: 'test-client',
    sub: '109876543210987654321',
    iat: 0,
    exp: 0,
    name: 'Rami Test',
    email: 'Rami.Test@example.com',
    email_verified: true,
    locale: 'en',
    ...over,
  };
  return {
    provider: 'google',
    id: json.sub,
    displayName: json.name ?? '',
    emails: json.email ? [{ value: json.email, verified: json.email_verified === true }] : [],
    profileUrl: '',
    _raw: JSON.stringify(json),
    _json: json,
  } as Profile;
}

function dbUser(over: Partial<User> = {}): User {
  return {
    id: 'u-existing',
    fullName: 'Existing donor',
    phone: '+963900000006',
    email: null,
    googleSub: null,
    passwordHash: 'hash',
    role: 'DONOR' as Role,
    locale: 'ar',
    isActive: true,
    localCouncil: null,
    whatsappOptIn: true,
    donorCode: 'D-EXIST2',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...over,
  };
}

/** Prisma stub: `bySub` / `byEmail` are what the two lookups find; writes are captured. */
function setup(found: { bySub?: User | null; byEmail?: User | null } = {}) {
  const create = jest.fn(async ({ data }: { data: Partial<User> }) =>
    dbUser({ id: 'u-new', passwordHash: null, ...data }),
  );
  const update = jest.fn(async ({ data }: { data: Partial<User> }) =>
    dbUser({ ...found.byEmail, ...data }),
  );
  const tx = {
    user: { create, update, findUnique: jest.fn().mockResolvedValue(null) },
  };
  const findUnique = jest.fn(
    async ({ where }: { where: { googleSub?: string; email?: string } }) =>
      where.googleSub ? (found.bySub ?? null) : (found.byEmail ?? null),
  );
  const prisma = {
    user: { findUnique },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  } as unknown as PrismaService;
  const signAsync = jest.fn().mockResolvedValue('app-jwt');
  const jwt = { signAsync } as unknown as JwtService;
  const log = jest.fn();
  const audit = { log } as unknown as AuditService;
  return {
    service: new GoogleAuthService(prisma, jwt, audit),
    create,
    update,
    findUnique,
    signAsync,
    log,
  };
}

const SETTINGS: GoogleSettings = {
  clientID: 'test-client-id',
  clientSecret: 'test-client-secret',
  callbackURL: 'http://localhost:3000/auth/google/callback',
};

describe('googleIdentity (mocked Google profiles)', () => {
  it('keeps the stable sub, a lower-cased verified email, the name and the locale', () => {
    expect(googleIdentity(googleProfile())).toEqual({
      sub: '109876543210987654321',
      email: 'rami.test@example.com',
      name: 'Rami Test',
      locale: 'en',
    });
  });

  it('drops an unverified email and defaults the locale to Arabic', () => {
    expect(
      googleIdentity(googleProfile({ email_verified: false, locale: 'ar-SY' })),
    ).toMatchObject({ email: null, locale: 'ar' });
  });
});

describe('GoogleStrategy.validate → GoogleAuthService.signIn', () => {
  it('creates a DONOR without phone or password and returns the app session', async () => {
    const { service, create, signAsync, log } = setup();
    const strategy = new GoogleStrategy(SETTINGS, service);

    const res = await strategy.validate('google-at', 'google-rt', googleProfile());

    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      role: 'DONOR',
      phone: null,
      passwordHash: null,
      googleSub: '109876543210987654321',
      email: 'rami.test@example.com',
      fullName: 'Rami Test',
      locale: 'en',
      whatsappOptIn: false,
    });
    expect(data.donorCode).toMatch(/^D-[A-HJ-NP-Z2-9]{6}$/);
    expect(signAsync).toHaveBeenCalledWith({ sub: 'u-new', role: 'DONOR' });
    expect(res).toEqual({
      accessToken: 'app-jwt',
      user: expect.objectContaining({ role: 'DONOR', phone: null, googleLinked: true }),
    });
    expect(res.user).not.toHaveProperty('passwordHash');
    expect(res.user).not.toHaveProperty('googleSub');
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.google_register' }),
      expect.anything(),
    );
  });

  it('signs in the account already linked to this Google id (no new account)', async () => {
    const linked = dbUser({ id: 'u-linked', googleSub: '109876543210987654321', phone: null });
    const { service, create, update, signAsync } = setup({ bySub: linked });
    const res = await service.signIn(googleIdentity(googleProfile()));
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(signAsync).toHaveBeenCalledWith({ sub: 'u-linked', role: 'DONOR' });
    expect(res.user.phone).toBeNull();
  });

  it('links a DONOR account with the same verified email once (audited)', async () => {
    const existing = dbUser({ email: 'rami.test@example.com' });
    const { service, create, update, log } = setup({ byEmail: existing });
    const res = await service.signIn(googleIdentity(googleProfile()));
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'u-existing' },
      data: { googleSub: '109876543210987654321' },
    });
    expect(res.user).toMatchObject({
      id: 'u-existing',
      phone: '+963900000006',
      googleLinked: true,
    });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.google_link' }),
      expect.anything(),
    );
  });

  it.each(['ADMIN', 'STAFF', 'CASE_OFFICER', 'FINANCE_VERIFIER', 'COLLECTOR'] as Role[])(
    'never links or enters a %s account through Google',
    async (role) => {
      const staff = dbUser({ role, email: 'rami.test@example.com' });
      const { service, update, create, signAsync } = setup({ byEmail: staff });
      const result = service.signIn(googleIdentity(googleProfile()));
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.signIn(googleIdentity(googleProfile()))).rejects.toThrow(
        'google_staff_account',
      );
      expect(update).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(signAsync).not.toHaveBeenCalled();
    },
  );

  it('refuses an email already linked to a different Google account', async () => {
    const other = dbUser({ email: 'rami.test@example.com', googleSub: 'another-sub' });
    const { service, update } = setup({ byEmail: other });
    await expect(service.signIn(googleIdentity(googleProfile()))).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses a deactivated account with the login error', async () => {
    const off = dbUser({ googleSub: '109876543210987654321', isActive: false });
    const { service, signAsync } = setup({ bySub: off });
    await expect(service.signIn(googleIdentity(googleProfile()))).rejects.toThrow(
      new UnauthorizedException('invalid_credentials'),
    );
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('does not use an unverified email to link: a separate donor is created without email', async () => {
    const { service, findUnique, create } = setup({ byEmail: dbUser() });
    await service.signIn(googleIdentity(googleProfile({ email_verified: false })));
    expect(findUnique).toHaveBeenCalledTimes(1); // only the Google id lookup
    expect(create.mock.calls[0][0].data).toMatchObject({ email: null, role: 'DONOR' });
  });

  it('falls back to the email name when Google sends no display name', async () => {
    const { service, create } = setup();
    await service.signIn(googleIdentity(googleProfile({ name: undefined })));
    expect(create.mock.calls[0][0].data.fullName).toBe('rami.test');
  });
});

/** Runs passport's authenticate() on the strategy and resolves with what it ends in. */
function runPassport(
  strategy: GoogleStrategy,
  query: Record<string, string>,
  options: Record<string, unknown> = {},
): Promise<{ kind: 'success'; user: AuthResponse } | { kind: 'redirect'; url: string }> {
  return new Promise((resolve, reject) => {
    Object.assign(strategy, {
      success: (user: AuthResponse) => resolve({ kind: 'success', user }),
      redirect: (url: string) => resolve({ kind: 'redirect', url }),
      fail: (info: unknown) => reject(new Error(`fail ${JSON.stringify(info)}`)),
      error: (err: unknown) => reject(err),
    });
    strategy.authenticate({ query, body: {}, headers: {} } as unknown as Request, options);
  });
}

describe('GoogleStrategy through passport (Google endpoints stubbed, no network)', () => {
  it('start: redirects to Google with the client id, the web callback, the scopes and the state', async () => {
    const { service } = setup();
    const strategy = new GoogleStrategy(SETTINGS, service);
    const state = 'S'.repeat(43);
    const out = await runPassport(strategy, {}, { state, prompt: 'select_account' });
    if (out.kind !== 'redirect') throw new Error('expected a redirect');
    const url = new URL(out.url);
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('redirect_uri')).toBe(SETTINGS.callbackURL);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe(state);
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('prompt')).toBe('select_account');
    expect(out.url).not.toContain('test-client-secret');
  });

  it("callback: exchanges Google's one-time code and returns the app session", async () => {
    const { service, create } = setup();
    const strategy = new GoogleStrategy(SETTINGS, service);
    const internals = strategy as unknown as {
      _oauth2: {
        getOAuthAccessToken: (
          code: string,
          params: Record<string, string>,
          cb: (err: unknown, at?: string, rt?: string, params?: object) => void,
        ) => void;
      };
      userProfile: (token: string, done: (err: unknown, profile?: Profile) => void) => void;
    };
    const exchange = jest
      .spyOn(internals._oauth2, 'getOAuthAccessToken')
      .mockImplementation((_code, _params, cb) => cb(null, 'google-at', 'google-rt', {}));
    jest
      .spyOn(internals, 'userProfile')
      .mockImplementation((_token, done) => done(null, googleProfile()));

    const out = await runPassport(strategy, { code: 'one-time-code', state: 'S'.repeat(43) });

    expect(exchange).toHaveBeenCalledWith(
      'one-time-code',
      expect.objectContaining({
        grant_type: 'authorization_code',
        redirect_uri: SETTINGS.callbackURL,
      }),
      expect.any(Function),
    );
    if (out.kind !== 'success') throw new Error('expected success');
    expect(out.user.accessToken).toBe('app-jwt');
    expect(out.user.user).toMatchObject({ role: 'DONOR', phone: null });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
