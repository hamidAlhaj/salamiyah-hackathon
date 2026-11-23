import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './users.dto';
import { UsersService } from './users.service';

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '11111111-1111-1111-1111-111111111111';
const POINT_ID = '22222222-2222-2222-2222-222222222222';
const admin: AuthenticatedUser = { id: ADMIN_ID, role: Role.ADMIN };
const user = (role: Role): AuthenticatedUser => ({ id: ADMIN_ID, role });

const createDto = (over: Partial<CreateUserDto> = {}): CreateUserDto => ({
  fullName: 'مسؤول جديد',
  phone: '+963900000099',
  password: 'Secret@123',
  role: Role.COLLECTOR,
  ...over,
});

const row = (over: Record<string, unknown> = {}) => ({
  id: USER_ID,
  fullName: 'موظف',
  phone: '+963900000099',
  role: Role.STAFF,
  isActive: true,
  createdAt: new Date(),
  collectionPoints: [] as { id: string; name: string }[],
  ...over,
});

function serviceWith(prisma: unknown, audit: unknown = { log: jest.fn() }) {
  return new UsersService(
    prisma as PrismaService,
    audit as AuditService,
    new RoleAccessService(),
  );
}

describe('UsersService', () => {
  describe.each(Object.values(Role).filter((r) => r !== Role.ADMIN))('%s', (role) => {
    it('cannot list, create or update accounts', async () => {
      const service = serviceWith(untouchable('prisma'), untouchable('audit'));
      expect(() => service.list(user(role))).toThrow(ForbiddenException);
      await expect(service.create(createDto(), user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(
        service.update(USER_ID, { isActive: false }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('creates a collector with assigned points and never returns the password hash', async () => {
    const create = jest.fn().mockResolvedValue(row({ role: Role.COLLECTOR }));
    const log = jest.fn();
    const tx = { user: { create, findUnique: jest.fn().mockResolvedValue(null) } };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      collectionPoint: { count: jest.fn().mockResolvedValue(1) },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma, { log }).create(
      createDto({ collectionPointIds: [POINT_ID, POINT_ID] }),
      admin,
    );
    const args = create.mock.calls[0][0];
    expect(args.data.collectionPoints).toEqual({ connect: [{ id: POINT_ID }] });
    expect(args.data.passwordHash).not.toBe('Secret@123');
    expect(args.data.donorCode).toMatch(/^D-[A-HJ-NP-Z2-9]{6}$/);
    expect(args.select.passwordHash).toBeUndefined();
    expect(log.mock.calls[0][0]).toMatchObject({ action: 'user.create', entityId: USER_ID });
  });

  it('refuses collection points for a role other than COLLECTOR', async () => {
    await expect(
      serviceWith(untouchable('prisma')).create(
        createDto({ role: Role.STAFF, collectionPointIds: [POINT_ID] }),
        admin,
      ),
    ).rejects.toThrow('collection_points_collector_only');
  });

  it('refuses an unknown collection point', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      collectionPoint: { count: jest.fn().mockResolvedValue(0) },
    };
    await expect(
      serviceWith(prisma).create(createDto({ collectionPointIds: [POINT_ID] }), admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses a phone that is already registered', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: USER_ID }) } };
    await expect(serviceWith(prisma).create(createDto(), admin)).rejects.toThrow(
      'phone_taken',
    );
  });

  it('404s an unknown account', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    await expect(
      serviceWith(prisma).update(USER_ID, { isActive: false }, admin),
    ).rejects.toThrow('user_not_found');
  });

  it.each([[{ isActive: false }], [{ role: Role.STAFF }]])(
    'an admin never deactivates or demotes their own account (%j)',
    async (dto) => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(row({ id: ADMIN_ID, role: Role.ADMIN })),
        },
      };
      await expect(serviceWith(prisma).update(ADMIN_ID, dto, admin)).rejects.toBeInstanceOf(
        ConflictException,
      );
    },
  );

  it('moving a collector to another role clears their points; the audit keeps before/after', async () => {
    const update = jest.fn().mockResolvedValue(row({ role: Role.STAFF }));
    const log = jest.fn();
    const tx = { user: { update } };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue(
            row({ role: Role.COLLECTOR, collectionPoints: [{ id: POINT_ID, name: 'نقطة' }] }),
          ),
      },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma, { log }).update(USER_ID, { role: Role.STAFF }, admin);
    expect(update.mock.calls[0][0].data.collectionPoints).toEqual({ set: [] });
    expect(log.mock.calls[0][0]).toMatchObject({
      action: 'user.update',
      before: { role: Role.COLLECTOR, collectionPointIds: [POINT_ID] },
      after: { role: Role.STAFF, collectionPointIds: [] },
    });
  });

  it('assigns points to an existing collector', async () => {
    const update = jest
      .fn()
      .mockResolvedValue(row({ role: Role.COLLECTOR, collectionPoints: [{ id: POINT_ID }] }));
    const tx = { user: { update } };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(row({ role: Role.COLLECTOR })) },
      collectionPoint: { count: jest.fn().mockResolvedValue(1) },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma).update(USER_ID, { collectionPointIds: [POINT_ID] }, admin);
    expect(update.mock.calls[0][0].data.collectionPoints).toEqual({ set: [{ id: POINT_ID }] });
  });
});
