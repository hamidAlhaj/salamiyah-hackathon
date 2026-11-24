import type { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { DonationEventType } from '../pledges/donation-events';
import { isKnownLink } from './links';
import { NotificationsService } from './notifications.service';

const SITE = 'http://192.0.2.10:3000';
const config = { get: () => SITE } as unknown as ConfigService;

type Donor = { id: string; locale: 'ar' | 'en'; phone: string; whatsappOptIn: boolean } | null;

function pledge(donor: Donor, extra: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    referenceNo: 'P-ABC123',
    amount: new Prisma.Decimal(50000),
    currency: 'SYP',
    method: 'SYRIATEL_CASH',
    officialReceiptNo: null,
    campaign: { titleAr: 'كفالة أيتام', titleEn: 'Orphan sponsorship' },
    collectionPoint: null,
    donor,
    ...extra,
  };
}

/** A prisma stub: `writes` records every notification / outbox row the service creates. */
function setup(found: unknown) {
  const writes: { model: string; data: Record<string, unknown> }[] = [];
  const prisma = {
    pledge: { findUnique: jest.fn().mockResolvedValue(found) },
    notification: {
      create: jest.fn((args: { data: Record<string, unknown> }) => {
        writes.push({ model: 'notification', data: args.data });
        return args;
      }),
    },
    outboundMessage: {
      create: jest.fn((args: { data: Record<string, unknown> }) => {
        writes.push({ model: 'outbox', data: args.data });
        return args;
      }),
    },
    $transaction: jest.fn(async (ops: unknown[]) => ops),
  };
  return {
    service: new NotificationsService(prisma as unknown as PrismaService, config),
    writes,
  };
}

const optedIn: Donor = { id: 'u1', locale: 'ar', phone: '+963900000006', whatsappOptIn: true };

describe('NotificationsService.donationEvent', () => {
  const cases: [DonationEventType, string, string, Record<string, unknown>][] = [
    ['pledge.demo_confirmed', 'donation.demo', 'تجريبي', {}],
    ['pledge.created', 'donation.pledged', 'P-ABC123', {}],
    ['pledge.receipt_uploaded', 'donation.received', 'قيد التحقق', {}],
    [
      'pledge.cash_pledged',
      'donation.cash',
      'مكتب المجلس المحلي',
      { method: 'CASH', collectionPoint: { name: 'مكتب المجلس المحلي', area: 'وسط المدينة' } },
    ],
    [
      'pledge.cash_collected',
      'donation.collected',
      'بانتظار التحقق المالي',
      { method: 'CASH', collectionPoint: { name: 'مكتب المجلس المحلي', area: 'وسط المدينة' } },
    ],
    [
      'pledge.verified',
      'receipt.issued',
      'R-2026-000007',
      { officialReceiptNo: 'R-2026-000007' },
    ],
    ['pledge.rejected', 'receipt.rejected', 'المبلغ غير مطابق', {}],
  ];

  it.each(cases)(
    '%s → one in-app notification and one %s outbox message',
    async (type, template, mentions, extra) => {
      const { service, writes } = setup(pledge(optedIn, extra));
      await service.donationEvent({ type, pledgeId: 'p1', reason: 'المبلغ غير مطابق' });

      const notification = writes.filter((w) => w.model === 'notification');
      const outbox = writes.filter((w) => w.model === 'outbox');
      expect(notification).toHaveLength(1);
      expect(outbox).toHaveLength(1);
      expect(notification[0].data).toMatchObject({ userId: 'u1', type });
      expect(String(notification[0].data.body)).toContain(mentions);
      // B2: the link is a route that exists (web, and mapped on mobile).
      expect(isKnownLink(String(notification[0].data.link))).toBe(true);
      expect(outbox[0].data).toMatchObject({
        template,
        phone: '+963900000006',
        relatedId: 'p1',
      });
      expect(String(outbox[0].data.link).startsWith(SITE)).toBe(true);
      // Western digits only, in the donor's language.
      expect(String(outbox[0].data.body)).not.toMatch(/[٠-٩]/);
    },
  );

  it('links a verified donation to its official receipt page', async () => {
    const { service, writes } = setup(pledge(optedIn, { officialReceiptNo: 'R-2026-000007' }));
    await service.donationEvent({ type: 'pledge.verified', pledgeId: 'p1' });
    expect(writes[0].data.link).toBe('/receipts/R-2026-000007');
  });

  it('writes no outbox message when the donor did not opt in to WhatsApp', async () => {
    const { service, writes } = setup(pledge({ ...optedIn!, whatsappOptIn: false }));
    await service.donationEvent({ type: 'pledge.demo_confirmed', pledgeId: 'p1' });
    expect(writes.map((w) => w.model)).toEqual(['notification']);
  });

  it('writes nothing for an entry without a donor account (council / collector)', async () => {
    const { service, writes } = setup(pledge(null));
    await service.donationEvent({ type: 'pledge.verified', pledgeId: 'p1' });
    expect(writes).toEqual([]);
  });

  it('writes the message in English for an English-speaking donor', async () => {
    const { service, writes } = setup(pledge({ ...optedIn!, locale: 'en' }));
    await service.donationEvent({ type: 'pledge.demo_confirmed', pledgeId: 'p1' });
    expect(writes[0].data.title).toBe('Donation received (demo)');
    expect(String(writes[1].data.body)).toContain('Orphan sponsorship');
    expect(String(writes[1].data.body)).toContain('50,000');
  });

  it('never throws: a failure is logged and the donation stays', async () => {
    const prisma = {
      pledge: { findUnique: jest.fn().mockRejectedValue(new Error('db down')) },
    };
    const service = new NotificationsService(prisma as unknown as PrismaService, config);
    await expect(
      service.donationEvent({ type: 'pledge.created', pledgeId: 'p1' }),
    ).resolves.toBeUndefined();
  });
});

describe('NotificationsService.campaignPublished (urgent alerts)', () => {
  function publish(campaign: Record<string, unknown>, donors: unknown[]) {
    const createMany = jest.fn(async ({ data }: { data: unknown[] }) => ({
      count: data.length,
    }));
    const findMany = jest.fn().mockResolvedValue(donors);
    const prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'c1',
          slug: 'surgery-ab12c',
          titleAr: 'عملية قلب عاجلة',
          titleEn: null,
          status: 'ACTIVE',
          targetAmount: new Prisma.Decimal(3_000_000),
          currency: 'SYP',
          ...campaign,
        }),
      },
      user: { findMany },
      outboundMessage: { createMany },
    };
    return {
      service: new NotificationsService(prisma as unknown as PrismaService, config),
      createMany,
      findMany,
    };
  }
  const donors = [
    { id: 'd1', phone: '+963900000006', locale: 'ar' },
    { id: 'd2', phone: '+963999900001', locale: 'ar' },
    { id: 'd3', phone: '+963999900002', locale: 'en' },
  ];

  it.each(['URGENT', 'VERY_URGENT'])(
    'a %s campaign queues one message per opted-in donor',
    async (priority) => {
      const { service, createMany, findMany } = publish({ priority }, donors);
      await expect(service.campaignPublished('c1')).resolves.toBe(3);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'DONOR', isActive: true, whatsappOptIn: true, phone: { not: null } },
        }),
      );
      const rows = createMany.mock.calls[0][0].data as Record<string, unknown>[];
      expect(rows.map((r) => r.userId)).toEqual(['d1', 'd2', 'd3']);
      expect(rows.every((r) => r.template === 'campaign.urgent')).toBe(true);
      expect(rows[0].link).toBe(`${SITE}/campaigns/surgery-ab12c`);
    },
  );

  it('sends nothing for a NORMAL campaign or a draft', async () => {
    const normal = publish({ priority: 'NORMAL' }, donors);
    await expect(normal.service.campaignPublished('c1')).resolves.toBe(0);
    expect(normal.createMany).not.toHaveBeenCalled();
    const draft = publish({ priority: 'URGENT', status: 'DRAFT' }, donors);
    await expect(draft.service.campaignPublished('c1')).resolves.toBe(0);
    expect(draft.createMany).not.toHaveBeenCalled();
  });
});
