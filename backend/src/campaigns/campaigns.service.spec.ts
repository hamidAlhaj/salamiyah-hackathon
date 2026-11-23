import type { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { findIdentityFields } from '../../test/identity-fields';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import { CampaignStatsService } from './campaign-stats.service';
import type { CreateCampaignDto } from './campaigns.dto';
import { CampaignsService, toPublicCampaign } from './campaigns.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role,
});
const CATEGORY_ID = '22222222-2222-2222-2222-222222222222';
const dto = {
  categoryId: CATEGORY_ID,
  titleAr: 'ترميم سقف منزل',
  summaryAr: 'سقف منزل أسرة تضرر من الأمطار.',
  targetAmount: '7500000',
  currency: 'SYP',
  priority: 'NORMAL',
} as CreateCampaignDto;

function serviceWith(prisma: unknown, audit: unknown = { log: jest.fn() }) {
  const config = { get: () => 'true' } as unknown as ConfigService;
  return new CampaignsService(
    prisma as PrismaService,
    new CampaignStatsService(prisma as PrismaService, config),
    audit as AuditService,
    new RoleAccessService(),
    { campaignPublished: jest.fn().mockResolvedValue(0) } as unknown as NotificationsService,
  );
}

describe('CampaignsService.create (campaign creation by category)', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.ADMIN))(
    '%s cannot create a campaign directly',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma'), untouchable('audit')).create(dto, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('refuses a category flagged requiresMedicalCase, whatever its code', async () => {
    const prisma = {
      campaignCategory: {
        findUnique: jest.fn().mockResolvedValue({
          id: CATEGORY_ID,
          code: 'ANY_NAME',
          isActive: true,
          requiresMedicalCase: true,
        }),
      },
    };
    await expect(serviceWith(prisma).create(dto, user(Role.ADMIN))).rejects.toThrow(
      'category_requires_medical_case',
    );
  });

  it('refuses an inactive or unknown category with 404', async () => {
    const prisma = {
      campaignCategory: {
        findUnique: jest.fn().mockResolvedValue({ id: CATEGORY_ID, isActive: false }),
      },
    };
    await expect(serviceWith(prisma).create(dto, user(Role.ADMIN))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates and publishes in a generic category (code MEDICAL_AID without the flag is generic)', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ id: 'c1', slug: 'medical_aid-x', status: 'ACTIVE' });
    const log = jest.fn();
    const tx = { campaign: { create } };
    const prisma = {
      campaignCategory: {
        findUnique: jest.fn().mockResolvedValue({
          id: CATEGORY_ID,
          code: 'MEDICAL_AID',
          isActive: true,
          requiresMedicalCase: false,
        }),
      },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma, { log }).create(dto, user(Role.ADMIN));
    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({ categoryId: CATEGORY_ID, status: 'ACTIVE' });
    expect(data.publishedAt).toBeInstanceOf(Date);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'campaign.create', entityType: 'Campaign' }),
      tx,
    );
  });
});

describe('public campaign responses never contain identity fields', () => {
  /** A row deliberately polluted with identity data, as if a relation had leaked into it. */
  const pollutedRow = {
    id: 'c1',
    slug: 'roof-1',
    isOngoing: false,
    titleAr: 'ترميم',
    titleEn: null,
    summaryAr: 'ملخص',
    summaryEn: null,
    coverKey: 'home-1',
    area: 'حي البعث',
    priority: 'NORMAL',
    status: 'ACTIVE',
    currency: 'SYP',
    targetAmount: new Prisma.Decimal(100),
    verifiedAmount: new Prisma.Decimal(50),
    spentAmount: new Prisma.Decimal(0),
    acceptsPledges: true,
    publishedAt: new Date(),
    category: {
      id: 'k',
      code: 'HOME_RENOVATION',
      nameAr: 'ترميم',
      nameEn: 'Renovation',
      icon: 'home',
    },
    hospital: null,
    case: { category: 'SURGERY', isAnonymous: true, trackingNo: 'MF-1' },
    _count: { beneficiaries: 3 },
    // leaked identity data that must not reach the output:
    fullName: 'Secret Name',
    phone: '+963900000000',
    nationalIdHash: 'hash',
    createdBy: { fullName: 'Staff Name', phone: '+963911111111' },
    beneficiaries: [{ beneficiary: { fullName: 'Child Name', nationalIdHash: 'h' } }],
  };

  it('toPublicCampaign builds the response field by field', () => {
    const result = toPublicCampaign(
      pollutedRow as unknown as Parameters<typeof toPublicCampaign>[0],
      undefined,
      'ar',
    );
    expect(findIdentityFields(result)).toEqual([]);
    expect(result.beneficiariesCount).toBe(3);
  });

  it('the public list query never selects people (only counts beneficiaries)', async () => {
    const findMany = jest.fn().mockResolvedValue([pollutedRow]);
    const prisma = {
      campaign: { count: jest.fn().mockResolvedValue(1), findMany },
      pledge: { groupBy: jest.fn().mockResolvedValue([]) },
      $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
    };
    const page = await serviceWith(prisma).listPublic({
      page: 1,
      pageSize: 12,
      lang: 'ar',
    } as Parameters<CampaignsService['listPublic']>[0]);
    expect(findIdentityFields(page)).toEqual([]);
    const include = findMany.mock.calls[0][0].include as Record<string, unknown>;
    expect(Object.keys(include).sort()).toEqual(['_count', 'case', 'category', 'hospital']);
    expect(findIdentityFields(include)).toEqual([]);
  });
});
