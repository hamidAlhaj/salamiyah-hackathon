import { Prisma, Role } from '@prisma/client';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import { VerificationsService } from './verifications.service';

const verifier: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-0000000000f1',
  role: Role.FINANCE_VERIFIER,
};
const VERIFICATION_ID = '11111111-1111-1111-1111-111111111111';
const d = (n: number) => new Prisma.Decimal(n);

/** An approve() run against a stubbed transaction; returns what was written. */
async function approve(pledge: Record<string, unknown>) {
  const queryRaw = jest.fn().mockResolvedValue([{ nextval: BigInt(7) }]);
  const pledgeUpdate = jest.fn().mockResolvedValue({});
  const campaignUpdate = jest.fn().mockResolvedValue({
    id: 'c1',
    status: 'ACTIVE',
    verifiedAmount: d(3_100_000),
    targetAmount: d(9_600_000),
  });
  const tx = {
    verification: {
      findUnique: jest.fn().mockResolvedValue({
        id: VERIFICATION_ID,
        status: 'PENDING',
        pledge: {
          id: 'p1',
          campaignId: 'c1',
          amount: d(100_000),
          fundAmount: d(0),
          heldAmount: d(0),
          isDemo: false,
          donorId: 'donor-1',
          recordedById: null,
          campaign: {
            titleAr: 'كفالة أيتام',
            isGeneralFund: false,
            isOngoing: false,
            targetAmount: d(9_600_000),
            verifiedAmount: d(3_000_000),
          },
          ...pledge,
        },
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    pledge: { update: pledgeUpdate },
    campaign: { update: campaignUpdate },
    $queryRaw: queryRaw,
  };
  const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
  const notifications = { donationEvent: jest.fn().mockResolvedValue(undefined) };
  const service = new VerificationsService(
    prisma as unknown as PrismaService,
    { log: jest.fn() } as unknown as AuditService,
    notifications as unknown as NotificationsService,
    new RoleAccessService(),
  );
  const result = await service.approve(VERIFICATION_ID, verifier);
  return { result, queryRaw, pledgeUpdate, campaignUpdate, notifications };
}

describe('official receipts on approval', () => {
  it('a platform transfer gets R-YYYY-NNNNNN from the sequence and raises verifiedAmount', async () => {
    const { result, queryRaw, pledgeUpdate, campaignUpdate, notifications } = await approve({
      channel: 'PLATFORM',
      method: 'BEMO_TRANSFER',
      status: 'RECEIPT_UPLOADED',
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(result.officialReceiptNo).toMatch(/^R-\d{4}-000007$/);
    expect(pledgeUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'VERIFIED',
      officialReceiptNo: result.officialReceiptNo,
    });
    expect(campaignUpdate.mock.calls[0][0].data).toEqual({
      verifiedAmount: { increment: d(100_000) },
    });
    // The donor's "verified" notification (+ WhatsApp outbox with the receipt link).
    expect(notifications.donationEvent).toHaveBeenCalledWith({
      type: 'pledge.verified',
      pledgeId: 'p1',
    });
  });

  it('donor-chosen cash confirmed by a collector also gets an official receipt', async () => {
    const { result, queryRaw } = await approve({
      channel: 'PLATFORM',
      method: 'CASH',
      status: 'COLLECTED',
      recordedById: 'collector-1',
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(result.officialReceiptNo).toMatch(/^R-\d{4}-000007$/);
  });

  it('an anonymous box total recorded by a collector is verified without a receipt', async () => {
    const { result, queryRaw, pledgeUpdate, campaignUpdate } = await approve({
      channel: 'COLLECTOR',
      method: 'CASH',
      status: 'COLLECTED',
      donorId: null,
      recordedById: 'collector-1',
    });
    expect(queryRaw).not.toHaveBeenCalled();
    expect(result.officialReceiptNo).toBeNull();
    expect(pledgeUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'VERIFIED',
      officialReceiptNo: null,
    });
    // The money still counts as verified for the campaign.
    expect(campaignUpdate).toHaveBeenCalled();
  });

  it('a demo payment never gets an official receipt (it is never verified)', async () => {
    await expect(
      approve({
        channel: 'PLATFORM',
        method: 'SYRIATEL_CASH',
        status: 'DEMO_CONFIRMED',
        isDemo: true,
      }),
    ).rejects.toThrow('demo_not_verifiable');
  });
});
