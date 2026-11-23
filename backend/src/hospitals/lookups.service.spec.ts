import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import { LookupsService } from './lookups.service';

const ID = '11111111-1111-1111-1111-111111111111';
const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role,
});
const admin = user(Role.ADMIN);

function serviceWith(prisma: unknown, audit: unknown = { log: jest.fn() }) {
  return new LookupsService(
    prisma as PrismaService,
    audit as AuditService,
    new RoleAccessService(),
  );
}

describe('LookupsService setup (ADMIN only)', () => {
  describe.each(Object.values(Role).filter((r) => r !== Role.ADMIN))('%s', (role) => {
    it('cannot list all hospitals, or create/edit hospitals and collection points', async () => {
      const service = serviceWith(untouchable('prisma'), untouchable('audit'));
      expect(() => service.allHospitals(user(role))).toThrow(ForbiddenException);
      await expect(
        service.createHospital({ nameAr: 'مشفى', city: 'السلمية' }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.updateHospital(ID, { isActive: false }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.createCollectionPoint({ name: 'نقطة', area: 'حي' }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.updateCollectionPoint(ID, { isActive: false }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('creating a hospital writes an audit row in the same transaction', async () => {
    const log = jest.fn();
    const tx = {
      hospital: {
        create: jest.fn().mockResolvedValue({ id: ID, nameAr: 'مشفى', city: 'حماة' }),
      },
    };
    const prisma = { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) };
    await serviceWith(prisma, { log }).createHospital(
      { nameAr: ' مشفى ', city: ' حماة ' },
      admin,
    );
    expect(tx.hospital.create.mock.calls[0][0].data).toMatchObject({
      nameAr: 'مشفى',
      city: 'حماة',
      isPrivate: false,
    });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'hospital.create', entityId: ID }),
      tx,
    );
  });

  it('404s an unknown hospital or collection point', async () => {
    const prisma = {
      hospital: { findUnique: jest.fn().mockResolvedValue(null) },
      collectionPoint: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = serviceWith(prisma);
    await expect(
      service.updateHospital(ID, { isActive: false }, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateCollectionPoint(ID, { isActive: false }, admin),
    ).rejects.toThrow('collection_point_not_found');
  });

  it('an empty contact name clears it; the change is audited with before/after', async () => {
    const log = jest.fn();
    const before = { id: ID, name: 'نقطة', type: 'CENTER', area: 'حي', isActive: true };
    const update = jest.fn().mockResolvedValue({ ...before, isActive: false });
    const tx = { collectionPoint: { update } };
    const prisma = {
      collectionPoint: { findUnique: jest.fn().mockResolvedValue(before) },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma, { log }).updateCollectionPoint(
      ID,
      { contactName: '  ', isActive: false },
      admin,
    );
    expect(update.mock.calls[0][0].data).toMatchObject({ contactName: null, isActive: false });
    expect(log.mock.calls[0][0]).toMatchObject({
      action: 'collection_point.update',
      before: { isActive: true },
      after: { isActive: false },
    });
  });

  it('the public list never selects collectors or the contact person', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    await serviceWith({ collectionPoint: { findMany } }).activeCollectionPoints();
    expect(findMany.mock.calls[0][0].select).toEqual({
      id: true,
      name: true,
      type: true,
      area: true,
    });
  });
});
