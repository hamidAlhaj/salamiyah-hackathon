import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import { VerificationsService } from '../verifications/verifications.service';
import { CollectorService } from './collector.service';

const collector: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-0000000000c1',
  role: 'COLLECTOR',
};
const PLEDGE_ID = '66666666-6666-6666-6666-666666666666';

const row = (status: string) => ({
  id: PLEDGE_ID,
  referenceNo: 'P-8T6NZ7',
  amount: new Prisma.Decimal(100000),
  currency: 'SYP',
  isAnonymousDisplay: false,
  donorName: 'متبرع تجريبي',
  status,
  channel: 'PLATFORM',
  createdAt: new Date('2026-11-22T10:00:00Z'),
  campaign: { titleAr: 'عملية قلب' },
  collectionPoint: {
    id: 'pt1',
    name: 'مكتب المجلس المحلي',
    type: 'OFFICE',
    area: 'وسط المدينة',
  },
  verifications: [],
});

function setup(found: { status: string; isDemo?: boolean } | null, updated = 1) {
  const notifications = { donationEvent: jest.fn().mockResolvedValue(undefined) };
  const audit = { log: jest.fn() };
  const tx = {
    pledge: {
      findFirst: jest
        .fn()
        .mockResolvedValue(found ? { id: PLEDGE_ID, isDemo: false, ...found } : null),
      updateMany: jest.fn().mockResolvedValue({ count: updated }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(row('COLLECTED')),
    },
    verification: { create: jest.fn().mockResolvedValue({}) },
    // No `campaign` here: confirming must never touch a campaign's balance.
  };
  const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
  const service = new CollectorService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
    notifications as unknown as NotificationsService,
    new RoleAccessService(),
  );
  return { service, tx, notifications, audit };
}

describe('CollectorService roles', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.COLLECTOR))(
    '%s cannot use the collector dashboard',
    async (role) => {
      const s = new CollectorService(
        untouchable<PrismaService>('prisma'),
        untouchable<AuditService>('audit'),
        untouchable<NotificationsService>('notifications'),
        new RoleAccessService(),
      );
      const u = { id: 'x', role };
      await expect(s.pending(u)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(s.confirm(PLEDGE_ID, u)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(s.byReference('P-ABC123', u)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(s.history(u)).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});

describe('CollectorService.confirm («تأكيد الاستلام»)', () => {
  it("is scoped to my own active points: another collector's pledge is 404", async () => {
    const { service, tx } = setup(null);
    await expect(service.confirm(PLEDGE_ID, collector)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tx.pledge.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: PLEDGE_ID,
          method: 'CASH',
          collectionPoint: { isActive: true, collectors: { some: { id: collector.id } } },
        },
      }),
    );
    expect(tx.pledge.updateMany).not.toHaveBeenCalled();
  });

  it('confirms: COLLECTED, recorded by me, a PENDING verification and an acknowledgement', async () => {
    const { service, tx, notifications, audit } = setup({ status: 'PLEDGED' });
    const view = await service.confirm(PLEDGE_ID, collector);
    expect(tx.pledge.updateMany).toHaveBeenCalledWith({
      where: { id: PLEDGE_ID, status: 'PLEDGED' },
      data: { status: 'COLLECTED', recordedById: collector.id },
    });
    expect(tx.verification.create).toHaveBeenCalledWith({
      data: { pledgeId: PLEDGE_ID, status: 'PENDING' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'pledge.cash_collected', entityId: PLEDGE_ID }),
      tx,
    );
    // The donor's instant acknowledgement (in-app + WhatsApp outbox), not an official receipt.
    expect(notifications.donationEvent).toHaveBeenCalledWith({
      type: 'pledge.cash_collected',
      pledgeId: PLEDGE_ID,
    });
    expect(view).toMatchObject({ status: 'COLLECTED', donorName: 'متبرع تجريبي' });
  });

  it('rejects a second confirmation', async () => {
    const { service, notifications } = setup({ status: 'COLLECTED' });
    await expect(service.confirm(PLEDGE_ID, collector)).rejects.toThrow('already_collected');
    expect(notifications.donationEvent).not.toHaveBeenCalled();
  });

  it('rejects a double tap that loses the race (guarded update changed nothing)', async () => {
    const { service, tx } = setup({ status: 'PLEDGED' }, 0);
    await expect(service.confirm(PLEDGE_ID, collector)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.verification.create).not.toHaveBeenCalled();
  });

  it.each(['VERIFIED', 'CANCELLED', 'REJECTED'])(
    'rejects a pledge in status %s',
    async (status) => {
      const { service } = setup({ status });
      await expect(service.confirm(PLEDGE_ID, collector)).rejects.toThrow(
        'pledge_not_awaiting_cash',
      );
    },
  );
});

describe('CollectorService.byReference', () => {
  it('finds nothing outside my points (404)', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const s = new CollectorService(
      { pledge: { findFirst } } as unknown as PrismaService,
      untouchable<AuditService>('audit'),
      untouchable<NotificationsService>('notifications'),
      new RoleAccessService(),
    );
    await expect(s.byReference(' p-8t6nz7 ', collector)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findFirst.mock.calls[0][0].where).toMatchObject({
      referenceNo: 'P-8T6NZ7',
      collectionPoint: { collectors: { some: { id: collector.id } } },
    });
  });
});

describe('a collector never verifies money', () => {
  it('cannot approve or reject a verification (finance only)', async () => {
    const v = new VerificationsService(
      untouchable<PrismaService>('prisma'),
      untouchable<AuditService>('audit'),
      untouchable<NotificationsService>('notifications'),
      new RoleAccessService(),
    );
    await expect(v.approve('v1', collector)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(v.reject('v1', 'reason', collector)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
