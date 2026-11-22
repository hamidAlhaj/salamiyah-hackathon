import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import type { CreateExpenditureDto } from './expenditures.dto';
import { ExpendituresService } from './expenditures.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000009',
  role,
});
const finance = user(Role.FINANCE_VERIFIER);
const CAMPAIGN_ID = '22222222-2222-2222-2222-222222222222';
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
  flags: { lockedPayeeHospital?: boolean; code?: string },
  verified = '500',
): unknown {
  return {
    id: CAMPAIGN_ID,
    caseId: null,
    case: null,
    hospitalId: '33333333-3333-3333-3333-333333333333',
    currency: 'SYP',
    verifiedAmount: new Prisma.Decimal(verified),
    spentAmount: new Prisma.Decimal(0),
    targetAmount: new Prisma.Decimal(10000),
    category: {
      code: flags.code ?? 'ANY_CODE',
      lockedPayeeHospital: flags.lockedPayeeHospital ?? false,
      requiresMedicalCase: false,
      supportsMonthlySponsorship: false,
    },
  };
}

function serviceWith(prisma: unknown) {
  return new ExpendituresService(
    prisma as PrismaService,
    untouchable<StorageService>('storage'),
    untouchable<AuditService>('audit'),
    new RoleAccessService(),
  );
}

describe('ExpendituresService.create', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.FINANCE_VERIFIER))(
    '%s cannot record an expenditure (no DB, file or audit access)',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).create(dto(), undefined, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('FINANCE_VERIFIER passes the role check (then gets 404 for an unknown campaign)', async () => {
    const prisma = { campaign: { findUnique: jest.fn().mockResolvedValue(null) } };
    await expect(serviceWith(prisma).create(dto(), undefined, finance)).rejects.toBeInstanceOf(
      NotFoundException,
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

  it('rules read flags, not codes: a category coded MEDICAL_AID without the flag accepts a contractor', async () => {
    // Passes the payee rule and stops at the balance check (before any file is stored).
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue(campaignWith({ code: 'MEDICAL_AID' }, '500')),
      },
    };
    await expect(serviceWith(prisma).create(dto(), undefined, finance)).rejects.toThrow(
      'amount_exceeds_remaining_balance',
    );
  });

  it('an amount above verified − spent is refused with 409', async () => {
    const prisma = {
      campaign: { findUnique: jest.fn().mockResolvedValue(campaignWith({}, '999.99')) },
    };
    await expect(
      serviceWith(prisma).create(dto({ amount: '1000' }), undefined, finance),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('BENEFICIARY_FAMILY requires a beneficiary linked to the campaign', async () => {
    const prisma = {
      campaign: { findUnique: jest.fn().mockResolvedValue(campaignWith({}, '5000')) },
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

  it.each([Role.DONOR, Role.STAFF, Role.COLLECTOR])(
    '%s cannot read the spending list',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).listForCampaign(CAMPAIGN_ID, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});
