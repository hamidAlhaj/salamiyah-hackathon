import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import { AuditService, MASK, maskPersonal } from './audit.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role,
});
const ID = '22222222-2222-2222-2222-222222222222';
const service = (prisma: unknown) =>
  new AuditService(prisma as PrismaService, new RoleAccessService());

describe('maskPersonal', () => {
  it('masks phones, national IDs and private names at any depth, keeps the rest', () => {
    expect(
      maskPersonal({
        status: 'VERIFIED',
        phone: '+963900000006',
        nested: [{ nationalIdLast4: '1234', fullName: 'x', publicCode: 'B-0412' }],
      }),
    ).toEqual({
      status: 'VERIFIED',
      phone: MASK,
      nested: [{ nationalIdLast4: MASK, fullName: MASK, publicCode: 'B-0412' }],
    });
    expect(maskPersonal(null)).toBeNull();
  });
});

describe('AuditService history panels', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.ADMIN))(
    '%s cannot read a history panel',
    async (role) => {
      const s = service(untouchable('prisma'));
      await expect(s.campaignHistory(user(role), ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(s.caseHistory(user(role), ID)).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('404s an unknown campaign or case', async () => {
    const prisma = {
      campaign: { findUnique: jest.fn().mockResolvedValue(null) },
      case: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    await expect(service(prisma).campaignHistory(user(Role.ADMIN), ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service(prisma).caseHistory(user(Role.ADMIN), ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('a campaign panel reads the campaign, its case and its pledges, names pledges, masks phones', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'a1',
        action: 'pledge.verify',
        entityType: 'Pledge',
        entityId: 'p1',
        actor: { fullName: 'المدقق المالي', role: 'FINANCE_VERIFIER' },
        before: { status: 'RECEIPT_UPLOADED' },
        after: { status: 'VERIFIED', donorPhone: '+963900000006' },
        createdAt: new Date('2026-11-01T10:00:00Z'),
      },
    ]);
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({
          id: ID,
          caseId: 'c1',
          pledges: [{ id: 'p1', referenceNo: 'P-SD0001' }],
        }),
      },
      auditLog: { findMany },
    };
    const rows = await service(prisma).campaignHistory(user(Role.ADMIN), ID);
    expect(findMany.mock.calls[0][0].where.OR).toEqual([
      { entityType: 'Campaign', entityId: ID },
      { entityType: 'Case', entityId: 'c1' },
      { entityType: 'Pledge', entityId: { in: ['p1'] } },
    ]);
    expect(rows[0]).toMatchObject({
      reference: 'P-SD0001',
      after: { status: 'VERIFIED', donorPhone: MASK },
      createdAt: '2026-11-01T10:00:00.000Z',
    });
  });
});
