import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma/prisma.service';
import { EmailRegistrationService } from './email-registration.service';
import { AuthService } from './auth.service';

const email = 'fixture@example.test';
const password = 'Fixture-Only-Password';

function fixture() {
  const data = {
    email,
    fullName: 'Test Donor',
    id: 'donor-id',
    role: 'DONOR',
    isActive: true,
    googleSub: null,
  };
  const create = jest.fn(async ({ data: supplied }: { data: Record<string, unknown> }) => ({
    ...data,
    phone: null,
    ...supplied,
  }));
  const findUnique = jest.fn().mockResolvedValue(null);
  const user = { create, findUnique };
  const transaction = { user };
  const prisma = {
    user,
    $transaction: (work: (tx: typeof transaction) => unknown) => work(transaction),
  } as unknown as PrismaService;
  const config = new ConfigService({
    RESEND_API_KEY: 'test-value',
    EMAIL_REGISTRATION_FROM: 'Athar <fixture@example.test>',
    JWT_SECRET: 'test-only-secret',
    EMAIL_REGISTRATION_ORIGIN: 'http://localhost:3000',
  });
  const jwt = new JwtService({ secret: 'test-only-secret', signOptions: { expiresIn: '8h' } });
  const audit = { log: jest.fn() };
  const registration = new EmailRegistrationService(
    prisma,
    config,
    jwt,
    audit as unknown as AuditService,
  );
  return {
    registration,
    config,
    jwt,
    auth: new AuthService(prisma, jwt),
    create,
    findUnique,
    audit,
  };
}

function mailTransport() {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 200 }));
}

async function requestToken(
  service: EmailRegistrationService,
  mail: ReturnType<typeof mailTransport>,
) {
  await expect(service.start({ email, locale: 'en' })).resolves.toEqual({ accepted: true });
  const body = JSON.parse(String(mail.mock.calls.at(-1)?.[1]?.body)) as {
    text: string;
    to: string[];
  };
  expect(body.to).toEqual([email]);
  const link = new URL(body.text.match(/http[^\s]+/)?.[0] ?? '');
  expect(link.pathname + link.search).toBe('/register?method=email');
  return new URLSearchParams(link.hash.slice(1)).get('token') ?? '';
}

describe('email registration', () => {
  afterEach(() => jest.restoreAllMocks());

  it('creates a donor only after mailbox proof, then supports password sign-in by email', async () => {
    const { registration, jwt, auth, create, findUnique, audit } = fixture();
    const token = await requestToken(registration, mailTransport());
    expect(create).not.toHaveBeenCalled();
    expect(() => jwt.verify(token)).toThrow();
    const result = await registration.complete({ token, fullName: 'Test Donor', password });
    const [request] = create.mock.calls[0];
    expect(request.data).toMatchObject({ email, role: 'DONOR', locale: 'en' });
    expect(await bcrypt.compare(password, String(request.data.passwordHash))).toBe(true);
    expect(result.user).toMatchObject({ role: 'DONOR', phone: null });
    expect(result.user).not.toHaveProperty('email');
    expect(audit.log).toHaveBeenCalledTimes(1);
    findUnique.mockResolvedValue(await create.mock.results[0].value);
    await expect(auth.login({ email, password })).resolves.toMatchObject({
      user: { role: 'DONOR' },
    });
  });

  it('rejects expired or previously used links', async () => {
    const { registration, create } = fixture();
    const token = await requestToken(registration, mailTransport());
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 31 * 60 * 1000);
    await expect(
      registration.complete({ token, fullName: 'Test Donor', password }),
    ).rejects.toThrow('email_registration_link_invalid');
    jest.restoreAllMocks();
    create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '5.22.0',
        meta: { target: ['email'] },
      }),
    );
    await expect(
      registration.complete({ token, fullName: 'Test Donor', password }),
    ).rejects.toThrow('email_registration_already_completed');
  });

  it('does not send a registration link to an existing account', async () => {
    const mail = mailTransport();
    const { registration, findUnique } = fixture();
    findUnique.mockResolvedValue({ id: 'already-registered' });
    await expect(registration.start({ email })).resolves.toEqual({ accepted: true });
    expect(mail).not.toHaveBeenCalled();
  });
});
