import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import type {
  CashPledgeDto,
  CollectorPledgeDto,
  CouncilPledgeDto,
  DemoPledgeDto,
} from './pledges.dto';
import { PledgesService } from './pledges.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000005',
  role,
});
const collectorDto = {
  campaignId: '44444444-4444-4444-4444-444444444444',
  collectionPointId: '55555555-5555-5555-5555-555555555555',
  amount: '750000',
} as unknown as CollectorPledgeDto;

function serviceWith(prisma: unknown) {
  return new PledgesService(
    prisma as PrismaService,
    untouchable<StorageService>('storage'),
    untouchable<AuditService>('audit'),
    untouchable<NotificationsService>('notifications'),
    untouchable<ConfigService>('config'),
    new RoleAccessService(),
  );
}

describe('PledgesService collector scoping', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.COLLECTOR))(
    '%s cannot record a collection-point pledge',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).createCollector(collectorDto, user(role)),
      ).rejects.toThrow('role_not_allowed');
    },
  );

  it('a COLLECTOR cannot record for a collection point that is not assigned to them', async () => {
    const collector = user(Role.COLLECTOR);
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = serviceWith({ collectionPoint: { findFirst } });

    const result = service.createCollector(collectorDto, collector);

    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.createCollector(collectorDto, collector)).rejects.toThrow(
      'collection_point_not_assigned',
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: collectorDto.collectionPointId,
        isActive: true,
        collectors: { some: { id: collector.id } },
      },
    });
  });

  it('a COLLECTOR cannot record council (in-person) pledges', async () => {
    await expect(
      serviceWith(untouchable('prisma')).createCouncil(
        {} as CouncilPledgeDto,
        user(Role.COLLECTOR),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([Role.STAFF, Role.FINANCE_VERIFIER, Role.ADMIN, Role.COLLECTOR])(
    '%s cannot use the donor-only "my donations" list',
    async (role) => {
      await expect(serviceWith(untouchable('prisma')).mine(user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    },
  );
});

// ── Donation paths (P10) ──────────────────────────────────────────────────────────────────────────
const CAMPAIGN_ID = '44444444-4444-4444-4444-444444444444';
const POINT_ID = '55555555-5555-5555-5555-555555555555';
const donor = user(Role.DONOR);

/** A prisma stub for the donor paths; `create` captures the pledge row that would be written. */
function donorPrisma(opts: { config?: unknown; point?: unknown } = {}) {
  const create = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'p1',
    ...data,
    amount: new Prisma.Decimal(data.amount as string),
    campaign: { id: CAMPAIGN_ID, slug: 'c', titleAr: 'حملة' },
    collectionPoint: data.collectionPointId
      ? { name: 'نقطة', area: 'حي', type: 'CENTER' }
      : null,
    verifications: [],
    createdAt: new Date(),
    verifiedAt: null,
  }));
  const tx = {
    pledge: { create },
    campaign: { findUniqueOrThrow: jest.fn().mockResolvedValue({ currency: 'SYP' }) },
  };
  const prisma = {
    paymentMethodConfig: {
      findUnique: jest.fn().mockResolvedValue(
        opts.config === undefined
          ? {
              isActive: true,
              kind: 'WALLET',
              allowsDemoCheckout: true,
              allowsReceiptUpload: true,
            }
          : opts.config,
      ),
    },
    collectionPoint: { findFirst: jest.fn().mockResolvedValue(opts.point ?? null) },
    user: {
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ id: donor.id, fullName: 'متبرع', phone: '+963900000006' }),
    },
    campaign: {
      findUnique: jest.fn().mockResolvedValue({ status: 'ACTIVE', acceptsPledges: true }),
    },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  return { prisma, create };
}

function donorService(prisma: unknown, demoMode = 'true') {
  return new PledgesService(
    prisma as PrismaService,
    untouchable<StorageService>('storage'),
    { log: jest.fn() } as unknown as AuditService,
    untouchable<NotificationsService>('notifications'),
    { get: () => demoMode } as unknown as ConfigService,
    new RoleAccessService(),
  );
}

describe('PledgesService simulated («Demo») payment', () => {
  const demoDto = (method: string) =>
    ({ campaignId: CAMPAIGN_ID, amount: '100000', method }) as DemoPledgeDto;

  it('is DEMO_CONFIRMED and isDemo with no verification, so it can never become verified money', async () => {
    const { prisma, create } = donorPrisma();
    const view = await donorService(prisma).createDemo(demoDto('SYRIATEL_CASH'), donor);
    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      status: 'DEMO_CONFIRMED',
      isDemo: true,
      method: 'SYRIATEL_CASH',
    });
    expect(data).not.toHaveProperty('verifications');
    expect(view.isDemo).toBe(true);
  });

  it('is refused for a method that is switched off', async () => {
    const { prisma, create } = donorPrisma({
      config: { isActive: false, allowsDemoCheckout: true },
    });
    await expect(donorService(prisma).createDemo(demoDto('PAYPAL'), donor)).rejects.toThrow(
      'payment_method_unavailable',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('is refused outside DEMO_MODE', async () => {
    const { prisma } = donorPrisma();
    await expect(
      donorService(prisma, 'false').createDemo(demoDto('VISA'), donor),
    ).rejects.toThrow('demo_mode_disabled');
  });
});

describe('PledgesService cash at a collection point', () => {
  const dto = {
    campaignId: CAMPAIGN_ID,
    amount: '250000',
    collectionPointId: POINT_ID,
  } as CashPledgeDto;

  it('requires an active collection point', async () => {
    const { prisma, create } = donorPrisma({ point: null });
    await expect(donorService(prisma).createCash(dto, donor)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(donorService(prisma).createCash(dto, donor)).rejects.toThrow(
      'collection_point_unavailable',
    );
    expect(prisma.collectionPoint.findFirst).toHaveBeenCalledWith({
      where: { id: POINT_ID, isActive: true },
      select: { id: true },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a PLEDGED cash pledge at that point (pending only once the collector confirms)', async () => {
    const { prisma, create } = donorPrisma({
      point: { id: POINT_ID },
      config: { isActive: true, kind: 'CASH' },
    });
    const view = await donorService(prisma).createCash(
      { ...dto, isAnonymousDisplay: true },
      donor,
    );
    expect(create.mock.calls[0][0].data).toMatchObject({
      method: 'CASH',
      status: 'PLEDGED',
      collectionPointId: POINT_ID,
      isAnonymousDisplay: true,
      donorId: donor.id,
    });
    expect(view.collectionPoint?.area).toBe('حي');
  });

  it.each([Role.STAFF, Role.COLLECTOR, Role.ADMIN])(
    '%s cannot make a donor cash pledge',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).createCash(dto, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});

describe('PledgesService receipt upload', () => {
  const file = {} as Express.Multer.File;
  const pledge = {
    id: 'p1',
    donorId: donor.id,
    channel: 'PLATFORM',
    isDemo: false,
    method: 'BEMO_TRANSFER',
    status: 'PLEDGED',
  };

  function uploadService(found: unknown, reused: unknown) {
    const prisma = {
      pledge: { findUnique: jest.fn().mockResolvedValue(found) },
      receipt: { findFirst: jest.fn().mockResolvedValue(reused) },
      $transaction: untouchable('transaction'),
    };
    const storage = {
      save: jest.fn().mockResolvedValue({
        sha256: 'abc',
        storageKey: 'k',
        mimeType: 'image/jpeg',
        sizeBytes: 1,
      }),
    };
    const service = new PledgesService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      untouchable<AuditService>('audit'),
      untouchable<NotificationsService>('notifications'),
      untouchable<ConfigService>('config'),
      new RoleAccessService(),
    );
    return { service, prisma };
  }

  it('still refuses the same receipt file used for another pledge (sha256 dedupe)', async () => {
    const { service, prisma } = uploadService(pledge, { id: 'other-receipt' });
    await expect(service.uploadReceipt('p1', file, undefined, donor)).rejects.toThrow(
      'duplicate_receipt',
    );
    expect(prisma.receipt.findFirst).toHaveBeenCalledWith({
      where: { sha256: 'abc', pledgeId: { not: 'p1' } },
    });
  });

  it.each([
    ['a demo payment', { ...pledge, isDemo: true, status: 'DEMO_CONFIRMED' }],
    ['a cash pledge', { ...pledge, method: 'CASH' }],
  ])('has no receipt step for %s', async (_label, found) => {
    const { service } = uploadService(found, null);
    await expect(service.uploadReceipt('p1', file, undefined, donor)).rejects.toThrow(
      'receipt_not_applicable',
    );
  });
});
