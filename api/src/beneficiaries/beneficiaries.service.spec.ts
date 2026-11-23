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

  it('reopens an ended link instead of refusing it', async () => {
    const update = jest.fn().mockResolvedValue({ monthlyAmount: null, startedAt: new Date() });
    const tx = { campaignBeneficiary: { update, create: jest.fn() } };
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
          .mockResolvedValue({ id: BENEFICIARY_ID, publicCode: 'B-7K3Q', isSuspended: false }),
      },
      campaignBeneficiary: {
        findUnique: jest.fn().mockResolvedValue({ id: 'link', endedAt: new Date() }),
      },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma).linkToCampaign(
      CAMPAIGN_ID,
      { beneficiaryId: BENEFICIARY_ID },
      admin,
    );
    expect(update.mock.calls[0][0].data).toMatchObject({ endedAt: null });
    expect(tx.campaignBeneficiary.create).not.toHaveBeenCalled();
  });
});

describe('BeneficiariesService.update and updateLink', () => {
  const admin = user(Role.ADMIN);

  it.each(Object.values(Role).filter((r) => r !== Role.ADMIN))(
    '%s cannot edit a beneficiary or a campaign link',
    async (role) => {
      const service = serviceWith(untouchable('prisma'), untouchable('audit'));
      await expect(
        service.update(BENEFICIARY_ID, { area: 'x' }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.updateLink(CAMPAIGN_ID, BENEFICIARY_ID, { end: true }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('never writes the private name or phone into the audit row', async () => {
    const log = jest.fn();
    const tx = {
      beneficiary: {
        update: jest.fn().mockResolvedValue({
          publicCode: 'B-7K3Q',
          kind: 'ORPHAN',
          area: 'حي',
          fullName: 'سري',
        }),
      },
    };
    const prisma = {
      beneficiary: {
        findUnique: jest.fn().mockResolvedValue({
          id: BENEFICIARY_ID,
          publicCode: 'B-7K3Q',
          kind: 'ORPHAN',
          area: null,
        }),
      },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma, { log }).update(
      BENEFICIARY_ID,
      { fullName: 'سري جداً', phone: '+963944123456' },
      admin,
    );
    const entry = JSON.stringify(log.mock.calls[0][0]);
    expect(entry).not.toContain('سري');
    expect(entry).not.toContain('944123456');
    expect(entry).toContain('"privateFieldsChanged":true');
  });

  it('refuses a monthly amount on a link whose category has no monthly sponsorship', async () => {
    const prisma = {
      campaignBeneficiary: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'link',
          endedAt: null,
          monthlyAmount: null,
          beneficiary: { publicCode: 'B-7K3Q' },
          campaign: { category: { supportsMonthlySponsorship: false } },
        }),
      },
    };
    await expect(
      serviceWith(prisma).updateLink(
        CAMPAIGN_ID,
        BENEFICIARY_ID,
        { monthlyAmount: '1000' },
        admin,
      ),
    ).rejects.toThrow('monthly_sponsorship_not_supported');
  });

  it('ends an active link (kept for history) and 404s an ended one', async () => {
    const update = jest.fn().mockResolvedValue({ monthlyAmount: null, endedAt: new Date() });
    const tx = { campaignBeneficiary: { update } };
    const findUnique = jest.fn().mockResolvedValue({
      id: 'link',
      endedAt: null,
      monthlyAmount: null,
      beneficiary: { publicCode: 'B-7K3Q' },
      campaign: { category: { supportsMonthlySponsorship: true } },
    });
    const prisma = {
      campaignBeneficiary: { findUnique },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    const result = await serviceWith(prisma).updateLink(
      CAMPAIGN_ID,
      BENEFICIARY_ID,
      { end: true },
      admin,
    );
    expect(update.mock.calls[0][0].data.endedAt).toBeInstanceOf(Date);
    expect(result.endedAt).not.toBeNull();

    findUnique.mockResolvedValue({ id: 'link', endedAt: new Date() });
    await expect(
      serviceWith(prisma).updateLink(CAMPAIGN_ID, BENEFICIARY_ID, { end: true }, admin),
    ).rejects.toThrow('beneficiary_not_linked');
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
