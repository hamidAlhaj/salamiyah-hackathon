import { ConflictException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

const dto = (extra: Partial<RegisterDto> = {}): RegisterDto => ({
  fullName: ' متبرع تجريبي ',
  phone: '+963999000111',
  password: 'Passw0rd!x',
  ...extra,
});

function setup(existing: unknown = null) {
  const create = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'u1',
    role: 'DONOR',
    locale: 'ar',
    ...data,
  }));
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(existing), create },
  } as unknown as PrismaService;
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') } as unknown as JwtService;
  return { service: new AuthService(prisma, jwt), create };
}

describe('AuthService.register', () => {
  it('creates a DONOR and stores the WhatsApp opt-in', async () => {
    const { service, create } = setup();
    const res = await service.register(dto({ whatsappOptIn: true }));
    expect(create.mock.calls[0][0].data).toMatchObject({
      fullName: 'متبرع تجريبي',
      role: 'DONOR',
      whatsappOptIn: true,
    });
    expect(create.mock.calls[0][0].data.donorCode).toMatch(/^D-[A-HJ-NP-Z2-9]{6}$/);
    expect(res.user.donorCode).toBe(create.mock.calls[0][0].data.donorCode);
    expect(res.accessToken).toBe('token');
    expect(res.user).not.toHaveProperty('passwordHash');
  });

  it('defaults the opt-in to false', async () => {
    const { service, create } = setup();
    await service.register(dto());
    expect(create.mock.calls[0][0].data).toMatchObject({ whatsappOptIn: false });
  });

  it('refuses a phone that is already registered', async () => {
    const { service, create } = setup({ id: 'other' });
    await expect(service.register(dto())).rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });
});
