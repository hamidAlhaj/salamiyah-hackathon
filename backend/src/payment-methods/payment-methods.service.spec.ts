import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import { PaymentMethodsService } from './payment-methods.service';

const CAMPAIGN_ID = '11111111-1111-1111-1111-111111111111';
const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000001',
  role,
});
const admin = user(Role.ADMIN);

function serviceWith(prisma: unknown, audit: unknown = { log: jest.fn() }) {
  return new PaymentMethodsService(
    prisma as PrismaService,
    audit as AuditService,
    new RoleAccessService(),
  );
}

describe('PaymentMethodsService setup (ADMIN only)', () => {
  describe.each(Object.values(Role).filter((r) => r !== Role.ADMIN))('%s', (role) => {
    it('cannot read or edit configs and campaign overrides', async () => {
      const service = serviceWith(untouchable('prisma'), untouchable('audit'));
      expect(() => service.listConfigs(user(role))).toThrow(ForbiddenException);
      await expect(
        service.updateConfig('SHAM_CASH', { isActive: false }, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.campaignOverrides(CAMPAIGN_ID, user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(
        service.setCampaignAccount(
          CAMPAIGN_ID,
          'SHAM_CASH',
          { accountName: 'حساب', accountNumber: '0930' },
          user(role),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('edits the default details only: empty strings clear, flags are never written', async () => {
    const log = jest.fn();
    const update = jest.fn().mockResolvedValue({
      id: 'cfg',
      accountNumber: '0930 000 777 (FAKE)',
      isActive: true,
      sortOrder: 2,
    });
    const tx = { paymentMethodConfig: { update } };
    const prisma = {
      paymentMethodConfig: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cfg',
          accountNumber: 'old',
          isActive: true,
          sortOrder: 1,
        }),
      },
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    };
    await serviceWith(prisma, { log }).updateConfig(
      'SYRIATEL_CASH',
      { accountNumber: ' 0930 000 777 (FAKE) ', instructionsEn: '', sortOrder: 2 },
      admin,
    );
    const data = update.mock.calls[0][0].data;
    expect(data).toMatchObject({
      accountNumber: '0930 000 777 (FAKE)',
      instructionsEn: null,
      sortOrder: 2,
    });
    expect(data.instructionsAr).toBeUndefined();
    expect(data).not.toHaveProperty('allowsDemoCheckout');
    expect(data).not.toHaveProperty('allowsReceiptUpload');
    expect(data).not.toHaveProperty('kind');
    expect(log.mock.calls[0][0]).toMatchObject({
      action: 'payment_method.update',
      before: { accountNumber: 'old' },
      after: { accountNumber: '0930 000 777 (FAKE)' },
    });
  });

  it('404s an unknown method and an unknown campaign', async () => {
    const prisma = {
      paymentMethodConfig: { findUnique: jest.fn().mockResolvedValue(null) },
      campaign: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = serviceWith(prisma);
    await expect(
      service.updateConfig('PAYPAL', { isActive: false }, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.campaignOverrides(CAMPAIGN_ID, admin)).rejects.toThrow(
      'campaign_not_found',
    );
  });

  it('lists the overrides of a campaign in any status', async () => {
    const accounts = [
      { method: 'SYRIATEL_CASH', accountName: 'a', accountNumber: 'n', note: null },
    ];
    const findUnique = jest.fn().mockResolvedValue({ paymentAccounts: accounts });
    await expect(
      serviceWith({ campaign: { findUnique } }).campaignOverrides(CAMPAIGN_ID, admin),
    ).resolves.toEqual(accounts);
    expect(findUnique.mock.calls[0][0].where).toEqual({ id: CAMPAIGN_ID });
  });
});
