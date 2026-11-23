import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import { WaLinkChannel } from './message-channel';
import { OutboxService } from './outbox.service';

const user = (role: Role): AuthenticatedUser => ({ id: 'a1', role });

function serviceWith(prisma: unknown, audit: unknown = untouchable('audit')) {
  return new OutboxService(
    prisma as PrismaService,
    audit as AuditService,
    new RoleAccessService(),
    new WaLinkChannel(),
  );
}

const row = {
  id: 'm1',
  template: 'donation.demo',
  status: 'QUEUED',
  phone: '+963900000006',
  body: 'تم استلام تبرعك (تجريبي)\nhttp://x/dashboard/donations',
  link: 'http://x/dashboard/donations',
  createdAt: new Date('2026-11-22T10:00:00Z'),
  openedAt: null,
  user: { fullName: 'متبرع تجريبي' },
};

describe('OutboxService', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.ADMIN))(
    '%s cannot read or open the outbox',
    async (role) => {
      const service = serviceWith(untouchable('prisma'));
      await expect(service.list({}, user(role))).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.markOpened('m1', user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    },
  );

  it('lists rows with a wa.me link that opens the prefilled message', async () => {
    const prisma = {
      outboundMessage: {
        findMany: jest.fn().mockResolvedValue([row]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const res = await serviceWith(prisma).list({ status: 'QUEUED' }, user(Role.ADMIN));
    expect(res.items[0].openUrl).toBe(
      `https://wa.me/963900000006?text=${encodeURIComponent(row.body)}`,
    );
    expect(res.queued).toBe(1);
  });

  it('marks a row OPENED once and records it in the audit log', async () => {
    const log = jest.fn();
    const update = jest
      .fn()
      .mockResolvedValue({ ...row, status: 'OPENED', openedAt: new Date() });
    const prisma = {
      outboundMessage: { findUnique: jest.fn().mockResolvedValue(row) },
      $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
        fn({ outboundMessage: { update } }),
      ),
    };
    const item = await serviceWith(prisma, { log }).markOpened('m1', user(Role.ADMIN));
    expect(item.status).toBe('OPENED');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'OPENED' }) }),
    );
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'outbox.opened', entityId: 'm1' }),
      expect.anything(),
    );
  });
});
