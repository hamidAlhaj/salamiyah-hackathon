import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { CategoriesService } from './categories.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role,
});
const admin = user(Role.ADMIN);
const ID = '11111111-1111-1111-1111-111111111111';
const createDto = {
  code: 'FOOD_BASKETS',
  nameAr: 'سلال غذائية',
  nameEn: 'Food baskets',
  icon: 'basket',
} as CreateCategoryDto;

function serviceWith(prisma: unknown, audit: unknown = { log: jest.fn() }) {
  return new CategoriesService(
    prisma as PrismaService,
    audit as AuditService,
    new RoleAccessService(),
  );
}

describe('CategoriesService', () => {
  describe.each(Object.values(Role).filter((r) => r !== Role.ADMIN))('%s', (role) => {
    const service = serviceWith(untouchable('prisma'), untouchable('audit'));
    it('cannot list all, create, update or delete categories', async () => {
      expect(() => service.listAll(user(role))).toThrow(ForbiddenException);
      await expect(service.create(createDto, user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(
        service.update(ID, { isActive: false } as UpdateCategoryDto, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.remove(ID, user(role))).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('creates a generic category: no behaviour flags, never system', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ id: ID, code: 'FOOD_BASKETS', icon: 'basket' });
    const tx = { campaignCategory: { create } };
    const prisma = {
      campaignCategory: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma).create(createDto, admin);
    expect(create.mock.calls[0][0].data).toMatchObject({
      code: 'FOOD_BASKETS',
      isSystem: false,
      requiresMedicalCase: false,
      lockedPayeeHospital: false,
      supportsMonthlySponsorship: false,
      beneficiaryKind: null,
    });
  });

  it('stores the beneficiary kind its campaigns link (data, e.g. FAMILY)', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ id: ID, code: 'SHELTER', beneficiaryKind: 'FAMILY' });
    const tx = { campaignCategory: { create } };
    const prisma = {
      campaignCategory: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma).create({ ...createDto, beneficiaryKind: 'FAMILY' }, admin);
    expect(create.mock.calls[0][0].data.beneficiaryKind).toBe('FAMILY');
  });

  it('refuses a duplicate code', async () => {
    const prisma = {
      campaignCategory: { findUnique: jest.fn().mockResolvedValue({ id: ID }) },
    };
    await expect(serviceWith(prisma).create(createDto, admin)).rejects.toThrow(
      'category_code_taken',
    );
  });

  it('never deletes a system category (deactivate it instead)', async () => {
    const prisma = {
      campaignCategory: {
        findUnique: jest.fn().mockResolvedValue({
          id: ID,
          code: 'MEDICAL_AID',
          isSystem: true,
          _count: { campaigns: 0 },
        }),
      },
    };
    await expect(serviceWith(prisma).remove(ID, admin)).rejects.toThrow(
      'system_category_cannot_be_deleted',
    );
  });

  it('never deletes a category that still has campaigns', async () => {
    const prisma = {
      campaignCategory: {
        findUnique: jest.fn().mockResolvedValue({
          id: ID,
          code: 'FOOD_BASKETS',
          isSystem: false,
          _count: { campaigns: 2 },
        }),
      },
    };
    await expect(serviceWith(prisma).remove(ID, admin)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('update never touches the code or the behaviour flags', async () => {
    const update = jest.fn().mockResolvedValue({ nameAr: 'x', icon: 'home', isActive: false });
    const tx = { campaignCategory: { update } };
    const prisma = {
      campaignCategory: {
        findUnique: jest.fn().mockResolvedValue({ nameAr: 'y', icon: 'home', isActive: true }),
      },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma).update(
      ID,
      { isActive: false, nameAr: 'x' } as UpdateCategoryDto,
      admin,
    );
    const data = update.mock.calls[0][0].data as Record<string, unknown>;
    for (const key of [
      'code',
      'isSystem',
      'requiresMedicalCase',
      'lockedPayeeHospital',
      'supportsMonthlySponsorship',
    ]) {
      expect(data).not.toHaveProperty(key);
    }
    expect(data.isActive).toBe(false);
  });

  it('public list: active only, ordered, localized, without behaviour flags', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: ID,
        code: 'ORPHAN_SPONSORSHIP',
        nameAr: 'كفالة أيتام',
        nameEn: 'Orphan sponsorship',
        descriptionAr: null,
        descriptionEn: 'Monthly',
        icon: 'child',
        sortOrder: 10,
      },
    ]);
    const result = await serviceWith({ campaignCategory: { findMany } }).listPublic('en');
    expect(findMany.mock.calls[0][0].where).toEqual({ isActive: true });
    expect(findMany.mock.calls[0][0].orderBy[0]).toEqual({ sortOrder: 'asc' });
    expect(Object.keys(findMany.mock.calls[0][0].select)).not.toContain('requiresMedicalCase');
    expect(result).toEqual([
      {
        id: ID,
        code: 'ORPHAN_SPONSORSHIP',
        name: 'Orphan sponsorship',
        description: 'Monthly',
        icon: 'child',
        sortOrder: 10,
      },
    ]);
  });
});
