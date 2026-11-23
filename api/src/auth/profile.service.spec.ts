import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Role, type User } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from './profile.service';

const ME = '00000000-0000-0000-0000-000000000022';
const PHONE = '+963900000022';

function setup(opts: { current?: Partial<User>; takenBy?: string | null } = {}) {
  const current = {
    id: ME,
    fullName: 'Google donor',
    phone: null,
    googleSub: 'sub-1',
    whatsappOptIn: false,
    role: 'DONOR',
    locale: 'ar',
    donorCode: 'D-GOOGL2',
    ...opts.current,
  };
  const update = jest.fn(async ({ data }: { data: Partial<User> }) => ({
    ...current,
    ...data,
  }));
  const tx = { user: { update } };
  const prisma = {
    user: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(current),
      findUnique: jest.fn().mockResolvedValue(opts.takenBy ? { id: opts.takenBy } : null),
    },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  } as unknown as PrismaService;
  const log = jest.fn();
  const service = new ProfileService(
    prisma,
    { log } as unknown as AuditService,
    new RoleAccessService(),
  );
  return { service, update, log };
}

describe('ProfileService.updatePhone', () => {
  it('lets a Google donor add a phone and the WhatsApp consent; the number is not audited', async () => {
    const { service, update, log } = setup();
    const me = await service.updatePhone(
      { phone: PHONE, whatsappOptIn: true },
      { id: ME, role: 'DONOR' },
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: ME },
      data: { phone: PHONE, whatsappOptIn: true },
    });
    expect(me).toMatchObject({ phone: PHONE, whatsappOptIn: true, googleLinked: true });
    expect(log.mock.calls[0][0]).toMatchObject({ action: 'user.phone_add' });
    expect(JSON.stringify(log.mock.calls[0][0])).not.toContain(PHONE);
  });

  it('keeps the WhatsApp consent when it is not sent, and audits a change', async () => {
    const { service, update, log } = setup({
      current: { phone: '+963900000099', whatsappOptIn: true },
    });
    await service.updatePhone({ phone: PHONE }, { id: ME, role: 'DONOR' });
    expect(update.mock.calls[0][0].data).toEqual({ phone: PHONE, whatsappOptIn: true });
    expect(log.mock.calls[0][0]).toMatchObject({ action: 'user.phone_change' });
  });

  it('keeps phones unique: refuses a number used by another account', async () => {
    const { service, update } = setup({ takenBy: 'someone-else' });
    const result = service.updatePhone({ phone: PHONE }, { id: ME, role: 'DONOR' });
    await expect(result).rejects.toBeInstanceOf(ConflictException);
    await expect(result).rejects.toThrow('phone_taken');
    expect(update).not.toHaveBeenCalled();
  });

  it('accepts saving the number the donor already has', async () => {
    const { service, update } = setup({ current: { phone: PHONE }, takenBy: ME });
    await service.updatePhone({ phone: PHONE }, { id: ME, role: 'DONOR' });
    expect(update).toHaveBeenCalled();
  });

  it.each(Object.values(Role).filter((r) => r !== Role.DONOR))(
    '%s cannot change a login phone here (ADMIN manages staff accounts)',
    async (role) => {
      const service = new ProfileService(
        untouchable<PrismaService>('prisma'),
        untouchable<AuditService>('audit'),
        new RoleAccessService(),
      );
      await expect(
        service.updatePhone({ phone: PHONE }, { id: ME, role }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});
