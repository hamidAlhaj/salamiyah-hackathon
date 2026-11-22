import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { findIdentityFields } from '../../test/identity-fields';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateBeneficiaryDto, LinkBeneficiaryDto } from './beneficiaries.dto';
import { BeneficiariesService, PUBLIC_BENEFICIARY_SELECT } from './beneficiaries.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role,
});
const CAMPAIGN_ID = '22222222-2222-2222-2222-222222222222';
const BENEFICIARY_ID = '33333333-3333-3333-3333-333333333333';

function serviceWith(prisma: unknown, audit: unknown = { log: jest.fn() }) {
  return new BeneficiariesService(
    prisma as PrismaService,
    audit as AuditService,
    new RoleAccessService(),
  );
}

describe('BeneficiariesService roles', () => {
  it.each([Role.DONOR, Role.COLLECTOR, Role.FINANCE_VERIFIER, Role.CASE_OFFICER])(
    '%s cannot search or register beneficiaries (private names)',
    async (role) => {
      const service = serviceWith(untouchable('prisma'), untouchable('audit'));
      expect(() => service.list(undefined, user(role))).toThrow(ForbiddenException);
      await expect(
        service.create(
          { kind: 'ORPHAN', fullName: 'x y z' } as CreateBeneficiaryDto,
          user(role),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it.each(Object.values(Role).filter((r) => r !== Role.ADMIN))(
    '%s cannot link a beneficiary to a campaign',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma'), untouchable('audit')).linkToCampaign(
          CAMPAIGN_ID,
          { beneficiaryId: BENEFICIARY_ID } as LinkBeneficiaryDto,
          user(role),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});

describe('BeneficiariesService.linkToCampaign', () => {
  const admin = user(Role.ADMIN);

  it('refuses a monthly amount when the category does not support monthly sponsorship (flag)', async () => {
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({
          id: CAMPAIGN_ID,
          category: { supportsMonthlySponsorship: false },
        }),
      },
    };
    await expect(
      serviceWith(prisma).linkToCampaign(
        CAMPAIGN_ID,
        { beneficiaryId: BENEFICIARY_ID, monthlyAmount: '200000' },
        admin,
      ),
    ).rejects.toThrow('monthly_sponsorship_not_supported');
  });

  it('answers a suspended beneficiary like an unknown one (404, no detail)', async () => {
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({
          id: CAMPAIGN_ID,
          category: { supportsMonthlySponsorship: true },
        }),
      },
      beneficiary: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: BENEFICIARY_ID, publicCode: 'B-7K3Q', isSuspended: true }),
      },
    };
    await expect(
      serviceWith(prisma).linkToCampaign(
        CAMPAIGN_ID,
        { beneficiaryId: BENEFICIARY_ID },
        admin,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('public beneficiaries never contain identity fields', () => {
  it('the public select only reads code, kind and area', () => {
    expect(Object.keys(PUBLIC_BENEFICIARY_SELECT).sort()).toEqual([
      'area',
      'kind',
      'publicCode',
    ]);
  });

  it('publicForCampaign output has no identity field even if a row carried one', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        monthlyAmount: new Prisma.Decimal(200000),
        startedAt: new Date('2026-11-01'),
        beneficiary: {
          publicCode: 'B-7K3Q',
          kind: 'ORPHAN',
          area: 'حي الشيخ بدر',
          // leaked identity data that must not reach the output:
          fullName: 'Child Name',
          phone: '+963900000000',
          nationalIdHash: 'hash',
        },
      },
    ]);
    const prisma = {
      campaign: { findFirst: jest.fn().mockResolvedValue({ id: CAMPAIGN_ID }) },
      campaignBeneficiary: { findMany },
    };
    const result = await serviceWith(prisma).publicForCampaign(CAMPAIGN_ID);
    expect(findIdentityFields(result)).toEqual([]);
    expect(result).toEqual([
      {
        code: 'B-7K3Q',
        kind: 'ORPHAN',
        area: 'حي الشيخ بدر',
        monthlyAmount: '200000.00',
        since: '2026-11-01T00:00:00.000Z',
      },
    ]);
    expect(findMany.mock.calls[0][0].select.beneficiary).toEqual({
      select: PUBLIC_BENEFICIARY_SELECT,
    });
  });
});
