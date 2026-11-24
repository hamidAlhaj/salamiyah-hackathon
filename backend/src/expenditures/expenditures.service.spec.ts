import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import type { CreateExpenditureDto, MonthlyRunDto } from './expenditures.dto';
import { ExpendituresService } from './expenditures.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000009',
  role,
});
const finance = user(Role.FINANCE_VERIFIER);
const CAMPAIGN_ID = '22222222-2222-2222-2222-222222222222';
const HOSPITAL_ID = '33333333-3333-3333-3333-333333333333';
const d = (n: number | string) => new Prisma.Decimal(n);
const dto = (overrides: Partial<CreateExpenditureDto> = {}) =>
  ({
    campaignId: CAMPAIGN_ID,
    payeeType: 'CONTRACTOR',
    payeeLabel: 'مقاول ترميم (مثال)',
    amount: '1000',
    paidAt: '2026-11-20',
    description: 'دفعة أولى',
    ...overrides,
  }) as CreateExpenditureDto;

/** A campaign whose category has the given flags. The code is deliberately misleading. */
function campaignWith(
  flags: {
    lockedPayeeHospital?: boolean;
    supportsMonthlySponsorship?: boolean;
    code?: string;
  },
  money: { verified?: string; spent?: string; target?: string } = {},
  extra: Record<string, unknown> = {},
) {
  return {
    id: CAMPAIGN_ID,
    status: 'ACTIVE',
    isOngoing: false,
    caseId: null,
    case: null,
    hospitalId: HOSPITAL_ID,
    hospital: { nameAr: 'مشفى الحوراني' },
    currency: 'SYP',
    verifiedAmount: d(money.verified ?? '500'),
    spentAmount: d(money.spent ?? '0'),
    targetAmount: d(money.target ?? '10000'),
    category: {
      code: flags.code ?? 'ANY_CODE',
      lockedPayeeHospital: flags.lockedPayeeHospital ?? false,
      requiresMedicalCase: false,
      supportsMonthlySponsorship: flags.supportsMonthlySponsorship ?? false,
    },
    ...extra,
  };
}

const stored = { storageKey: 'k', mimeType: 'image/jpeg', sizeBytes: 1, sha256: 'abc' };

/** A full happy-path stub: records the expenditure rows and campaign/case updates. */
function writableService(campaign: ReturnType<typeof campaignWith>) {
  const created: Record<string, unknown>[] = [];
  const campaignUpdates: Record<string, unknown>[] = [];
  const caseUpdates: Record<string, unknown>[] = [];
  let spent = campaign.spentAmount;
  const tx = {
    document: { create: jest.fn().mockResolvedValue({ id: 'doc-1' }) },
    expenditure: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: 'e1', payeeType: data.payeeType, proofPublic: data.proofPublic };
      }),
      createMany: jest.fn(async ({ data }: { data: Record<string, unknown>[] }) => {
        created.push(...data);
        return { count: data.length };
      }),
    },
    campaign: {
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        campaignUpdates.push(data);
        const inc = (data.spentAmount as { increment?: Prisma.Decimal } | undefined)
          ?.increment;
        if (inc) spent = spent.plus(inc);
        return {
          ...campaign,
          spentAmount: spent,
          status: data.status ?? campaign.status,
        };
      }),
    },
    case: {
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        caseUpdates.push(data);
        return {};
      }),
    },
  };
  return { tx, created, campaignUpdates, caseUpdates };
}

function serviceWith(prisma: unknown, storage: unknown = untouchable('storage')) {
  return new ExpendituresService(
    prisma as PrismaService,
    storage as StorageService,
    { log: jest.fn() } as unknown as AuditService,
    new RoleAccessService(),
  );
}

describe('ExpendituresService.create (payee rules read flags, balance limit)', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.FINANCE_VERIFIER))(
    '%s cannot record an expenditure (ADMIN views only)',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).create(dto(), undefined, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('an unknown campaign is 404', async () => {
    const prisma = { campaign: { findUnique: jest.fn().mockResolvedValue(null) } };
    await expect(serviceWith(prisma).create(dto(), undefined, finance)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('a completed campaign cannot spend any more', async () => {
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue(campaignWith({}, {}, { status: 'COMPLETED' })),
      },
    };
    await expect(serviceWith(prisma).create(dto(), undefined, finance)).rejects.toThrow(
      'campaign_not_spendable',
    );
  });

  it('lockedPayeeHospital: any payee other than the approved hospital is refused, whatever the code', async () => {
    const prisma = {
      campaign: {
        findUnique: jest
          .fn()
          .mockResolvedValue(
            campaignWith({ lockedPayeeHospital: true, code: 'NEW_CATEGORY' }),
          ),
      },
    };
    await expect(serviceWith(prisma).create(dto(), undefined, finance)).rejects.toThrow(
      'payee_must_be_locked_hospital',
    );
  });

  it('lockedPayeeHospital: the payee is the approved hospital and its name, whatever was typed', async () => {
    const campaign = campaignWith({ lockedPayeeHospital: true }, { verified: '5000' });
    const { tx, created } = writableService(campaign);
    const prisma = {
      campaign: { findUnique: jest.fn().mockResolvedValue(campaign) },
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    const storage = { save: jest.fn().mockResolvedValue(stored) };
    await serviceWith(prisma, storage).create(
      dto({ payeeType: 'HOSPITAL', payeeLabel: 'مشفى آخر' }),
      {} as Express.Multer.File,
      finance,
    );
    expect(created[0]).toMatchObject({
      payeeType: 'HOSPITAL',
      hospitalId: HOSPITAL_ID,
      payeeLabel: 'مشفى الحوراني',
    });
  });

  it('rules read flags, not codes: a category coded MEDICAL_AID without the flag accepts a contractor', async () => {
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue(campaignWith({ code: 'MEDICAL_AID' })),
      },
    };
    // Passes the payee rule and stops at the balance check (before any file is stored).
    await expect(serviceWith(prisma).create(dto(), undefined, finance)).rejects.toThrow(
      'amount_exceeds_remaining_balance',
    );
  });

  it('an amount above verified − spent is refused with 409', async () => {
    const prisma = {
      campaign: {
        findUnique: jest
          .fn()
          .mockResolvedValue(campaignWith({}, { verified: '1500', spent: '500.01' })),
      },
    };
    await expect(
      serviceWith(prisma).create(dto({ amount: '1000' }), undefined, finance),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('BENEFICIARY_FAMILY requires a beneficiary linked to the campaign', async () => {
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue(campaignWith({}, { verified: '5000' })),
      },
      campaignBeneficiary: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    await expect(
      serviceWith(prisma).create(
        dto({
          payeeType: 'BENEFICIARY_FAMILY',
          beneficiaryId: '44444444-4444-4444-4444-444444444444',
        }),
        undefined,
        finance,
      ),
    ).rejects.toThrow('beneficiary_not_linked');
  });
});

describe('«تم الإنجاز» when spent reaches the target', () => {
  it('a campaign becomes COMPLETED (no more pledges) and its medical case CLOSED', async () => {
    const campaign = campaignWith(
      { lockedPayeeHospital: true },
      { verified: '10000', spent: '9000', target: '10000' },
      { caseId: 'case-1', case: { status: 'PUBLISHED' } },
    );
    const { tx, campaignUpdates, caseUpdates } = writableService(campaign);
    const prisma = {
      campaign: { findUnique: jest.fn().mockResolvedValue(campaign) },
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    const res = await serviceWith(prisma, {
      save: jest.fn().mockResolvedValue(stored),
    }).create(
      dto({ payeeType: 'HOSPITAL', amount: '1000' }),
      {} as Express.Multer.File,
      finance,
    );
    expect(campaignUpdates).toContainEqual({ status: 'COMPLETED', acceptsPledges: false });
    expect(caseUpdates).toEqual([{ status: 'CLOSED' }]);
    expect(res.campaignStatus).toBe('COMPLETED');
  });

  it('below the target nothing changes; an ongoing programme is completed only by the council', async () => {
    for (const c of [
      campaignWith({}, { verified: '10000', spent: '0', target: '10000' }),
      campaignWith(
        {},
        { verified: '20000', spent: '9500', target: '10000' },
        { isOngoing: true },
      ),
    ]) {
      const { tx, campaignUpdates } = writableService(c);
      const prisma = {
        campaign: { findUnique: jest.fn().mockResolvedValue(c) },
        $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
      };
      await serviceWith(prisma, { save: jest.fn().mockResolvedValue(stored) }).create(
        dto({ amount: '1000' }),
        {} as Express.Multer.File,
        finance,
      );
      expect(campaignUpdates.some((u) => u.status === 'COMPLETED')).toBe(false);
    }
  });
});

describe('ExpendituresService.payMonth (monthly sponsorship)', () => {
  const run = { periodMonth: '2026-11' } as MonthlyRunDto;
  const links = ['B-AAAA', 'B-BBBB', 'B-CCCC', 'B-DDDD'].map((code, i) => ({
    beneficiaryId: `b${i}`,
    monthlyAmount: d(200000),
    beneficiary: { id: `b${i}`, publicCode: code, isSuspended: false },
  }));

  function monthly(
    flags: { supportsMonthlySponsorship?: boolean },
    verified: string,
    alreadyPaid: unknown[] = [],
  ) {
    const campaign = campaignWith(flags, { verified, target: '9600000' }, { isOngoing: true });
    const { tx, created } = writableService(campaign);
    const prisma = {
      campaign: { findUnique: jest.fn().mockResolvedValue(campaign) },
      campaignBeneficiary: { findMany: jest.fn().mockResolvedValue(links) },
      expenditure: { findMany: jest.fn().mockResolvedValue(alreadyPaid) },
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    return { service: serviceWith(prisma), created, prisma };
  }

  it('is refused for a category without supportsMonthlySponsorship', async () => {
    const { service } = monthly({}, '3000000');
    await expect(service.payMonth(CAMPAIGN_ID, run, undefined, finance)).rejects.toThrow(
      'monthly_sponsorship_not_supported',
    );
  });

  it('creates one row per sponsored beneficiary, by code only, in one transaction', async () => {
    const { service, created } = monthly({ supportsMonthlySponsorship: true }, '3000000');
    const res = await service.payMonth(CAMPAIGN_ID, run, undefined, finance);
    expect(res).toMatchObject({ count: 4, total: '800000.00', periodMonth: '2026-11' });
    expect(created).toHaveLength(4);
    expect(created.map((r) => r.payeeLabel)).toEqual(['B-AAAA', 'B-BBBB', 'B-CCCC', 'B-DDDD']);
    expect(
      created.every(
        (r) => r.payeeType === 'BENEFICIARY_FAMILY' && r.periodMonth === '2026-11',
      ),
    ).toBe(true);
    expect(created.every((r) => r.proofPublic === false)).toBe(true);
  });

  it('a second run for the same month is refused (idempotent)', async () => {
    const { service, created, prisma } = monthly(
      { supportsMonthlySponsorship: true },
      '3000000',
      [{ beneficiaryId: 'b0' }],
    );
    await expect(service.payMonth(CAMPAIGN_ID, run, undefined, finance)).rejects.toThrow(
      'month_already_paid',
    );
    expect(prisma.expenditure.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ periodMonth: '2026-11' }) }),
    );
    expect(created).toHaveLength(0);
  });

  it('is refused when the balance cannot cover every beneficiary', async () => {
    const { service, created } = monthly({ supportsMonthlySponsorship: true }, '799999');
    await expect(service.payMonth(CAMPAIGN_ID, run, undefined, finance)).rejects.toThrow(
      'amount_exceeds_remaining_balance',
    );
    expect(created).toHaveLength(0);
  });
});

describe('proof privacy', () => {
  it('a private (unpublished) proof is never served publicly: 404 without touching storage', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = serviceWith({ expenditure: { findFirst } }, untouchable('storage'));
    await expect(service.publicProof('e1')).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst.mock.calls[0][0].where).toMatchObject({
      id: 'e1',
      proofPublic: true,
      campaign: { status: { in: ['ACTIVE', 'FUNDED', 'COMPLETED'] } },
    });
  });

  it('the public timeline shows beneficiary payments by code only and hides unpublished proofs', async () => {
    const prisma = {
      campaign: { findFirst: jest.fn().mockResolvedValue({ id: CAMPAIGN_ID }) },
      expenditure: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'e1',
            paidAt: new Date('2026-11-20'),
            createdAt: new Date('2026-11-20'),
            payeeType: 'BENEFICIARY_FAMILY',
            payeeLabel: 'اسم خاص لا يُعرض',
            hospital: null,
            beneficiary: { publicCode: 'B-AAAA' },
            amount: d(200000),
            currency: 'SYP',
            description: 'كفالة شهر 2026-11',
            descriptionEn: null,
            periodMonth: '2026-11',
            proofPublic: false,
            proofDocument: { mimeType: 'image/jpeg' },
          },
        ]),
      },
    };
    const [row] = await serviceWith(prisma).publicTimeline(CAMPAIGN_ID, 'ar');
    expect(row).toMatchObject({ payeeLabel: null, beneficiaryCode: 'B-AAAA', proof: null });
    expect(JSON.stringify(row)).not.toContain('اسم خاص');
  });

  it.each([Role.DONOR, Role.STAFF, Role.COLLECTOR])(
    '%s cannot read the staff spending list or context',
    async (role) => {
      const s = serviceWith(untouchable('prisma'));
      await expect(s.listForCampaign(CAMPAIGN_ID, user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(s.spendingContext(CAMPAIGN_ID, user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    },
  );
});
