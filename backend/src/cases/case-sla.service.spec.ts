import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma/prisma.service';
import { CaseSlaService } from './case-sla.service';

const NOW = new Date('2026-11-23T12:00:00Z');
const CASE_ID = '44444444-4444-4444-4444-444444444444';

function setup({
  claimed = 1,
  due = [
    { id: CASE_ID, trackingNo: 'MF-2026-LATE1', slaDueAt: new Date('2026-11-21T11:00:00Z') },
  ],
} = {}) {
  const createMany = jest.fn().mockResolvedValue({ count: 2 });
  const updateMany = jest.fn().mockResolvedValue({ count: claimed });
  const log = jest.fn();
  const tx = { case: { updateMany }, notification: { createMany } };
  const prisma = {
    case: { findMany: jest.fn().mockResolvedValue(due) },
    user: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'officer', locale: 'ar' },
        { id: 'admin', locale: 'en' },
      ]),
    },
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  };
  const config = { get: jest.fn() } as unknown as ConfigService;
  const service = new CaseSlaService(
    prisma as unknown as PrismaService,
    { log } as unknown as AuditService,
    config,
  );
  return { service, prisma, createMany, updateMany, log };
}

describe('CaseSlaService.notifyOverdue (SLA alerts, once per case)', () => {
  it('looks only for reviewable cases past their deadline that were not alerted yet', async () => {
    const { service, prisma } = setup({ due: [] });
    expect(await service.notifyOverdue(NOW)).toBe(0);
    expect(prisma.case.findMany.mock.calls[0][0].where).toEqual({
      status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO'] },
      slaDueAt: { lt: NOW },
      overdueNotifiedAt: null,
    });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('claims the case, notifies every case officer and admin in their language, and audits', async () => {
    const { service, prisma, createMany, updateMany, log } = setup();
    expect(await service.notifyOverdue(NOW)).toBe(1);
    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({
      role: { in: ['CASE_OFFICER', 'ADMIN'] },
      isActive: true,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: CASE_ID, overdueNotifiedAt: null },
      data: { overdueNotifiedAt: NOW },
    });
    const rows = createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      userId: 'officer',
      type: 'case.overdue',
      link: `/dashboard/cases/${CASE_ID}`,
    });
    expect(rows[0].body).toContain('MF-2026-LATE1');
    expect(rows[0].body).toContain('منذ يومين');
    expect(rows[1].title).toBe('A case is past its review deadline');
    expect(log.mock.calls[0][0]).toMatchObject({
      action: 'case.overdue_alert',
      entityId: CASE_ID,
    });
  });

  it('sends nothing when another process already claimed the case', async () => {
    const { service, createMany, log } = setup({ claimed: 0 });
    expect(await service.notifyOverdue(NOW)).toBe(0);
    expect(createMany).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('never throws: a database failure is logged and counts as nothing sent', async () => {
    const { service, prisma } = setup();
    prisma.case.findMany.mockRejectedValueOnce(new Error('db down'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    await expect(service.notifyOverdue(NOW)).resolves.toBe(0);
  });
});
