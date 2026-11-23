import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import { qrSvg } from '../common/utils/qr';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import { PledgesService } from './pledges.service';

const SITE = 'http://192.0.2.10:3000';

function serviceFor(found: unknown) {
  const prisma = {
    pledge: { findUnique: jest.fn().mockResolvedValue(found) },
    paymentMethodConfig: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ labelAr: 'حوالة بنك بيمو', labelEn: 'Bemo transfer' }),
    },
  };
  return new PledgesService(
    prisma as unknown as PrismaService,
    untouchable<StorageService>('storage'),
    untouchable<AuditService>('audit'),
    untouchable<NotificationsService>('notifications'),
    { get: () => `${SITE}/` } as unknown as ConfigService,
    new RoleAccessService(),
  );
}

const verified = {
  status: 'VERIFIED',
  isDemo: false,
  verifiedAt: new Date('2026-11-22T12:00:00Z'),
  isAnonymousDisplay: false,
  donorName: 'متبرع تجريبي',
  donorPhone: '+963900000006',
  amount: new Prisma.Decimal(75000),
  currency: 'SYP',
  method: 'BEMO_TRANSFER',
  channel: 'PLATFORM',
  collectionPoint: null,
  campaign: {
    slug: 'roof-repair-albaath',
    titleAr: 'ترميم سقف منزل',
    titleEn: null,
    category: {
      id: 'k1',
      code: 'HOME_RENOVATION',
      nameAr: 'ترميم منازل',
      nameEn: 'Home renovation',
      icon: 'home',
    },
  },
};

describe('PledgesService.officialReceipt (public receipt page)', () => {
  it('builds the public URL from PUBLIC_WEB_URL and a QR code of exactly that URL', async () => {
    const r = await serviceFor(verified).officialReceipt('R-2026-000007');
    expect(r.url).toBe(`${SITE}/receipts/R-2026-000007`);
    expect(r.qrSvg.startsWith('<svg')).toBe(true);
    // The same input always gives the same QR: equal SVG means it encodes this URL.
    expect(r.qrSvg).toBe(await qrSvg(r.url));
    expect(r).toMatchObject({
      status: 'VERIFIED',
      methodLabel: 'حوالة بنك بيمو',
      category: { code: 'HOME_RENOVATION', name: 'ترميم منازل' },
    });
    // Never the donor's phone.
    expect(JSON.stringify(r)).not.toContain('+963900000006');
  });

  it('hides the name of a «فاعل خير» donor', async () => {
    const r = await serviceFor({ ...verified, isAnonymousDisplay: true }).officialReceipt(
      'R-2026-000007',
    );
    expect(r.donorName).toBe('');
  });

  it.each([
    ['an unknown number', null],
    [
      'a demo payment (DEMO reference, never verified)',
      { ...verified, status: 'DEMO_CONFIRMED', isDemo: true },
    ],
    [
      'a pledge still pending verification',
      { ...verified, status: 'COLLECTED', verifiedAt: null },
    ],
  ])('is not found for %s', async (_label, found) => {
    await expect(serviceFor(found).officialReceipt('R-2026-000007')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
