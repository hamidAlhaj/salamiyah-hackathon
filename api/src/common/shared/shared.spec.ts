import * as Prisma from '@prisma/client';
import * as Shared from '.';

describe('enum sync: src/common/shared matches the Prisma enums exactly', () => {
  const pairs: [string, Record<string, string>, Record<string, string>][] = [
    ['Role', Prisma.Role, Shared.Role],
    ['Locale', Prisma.Locale, Shared.Locale],
    ['Currency', Prisma.Currency, Shared.Currency],
    ['CampaignStatus', Prisma.CampaignStatus, Shared.CampaignStatus],
    ['CaseCategory', Prisma.CaseCategory, Shared.CaseCategory],
    ['CaseStatus', Prisma.CaseStatus, Shared.CaseStatus],
    ['CaseRoute', Prisma.CaseRoute, Shared.CaseRoute],
    ['Priority', Prisma.Priority, Shared.Priority],
    ['DocumentKind', Prisma.DocumentKind, Shared.DocumentKind],
    ['CollectionPointType', Prisma.CollectionPointType, Shared.CollectionPointType],
    ['PledgeChannel', Prisma.PledgeChannel, Shared.PledgeChannel],
    ['PaymentMethod', Prisma.PaymentMethod, Shared.PaymentMethod],
    ['PledgeStatus', Prisma.PledgeStatus, Shared.PledgeStatus],
    ['VerificationStatus', Prisma.VerificationStatus, Shared.VerificationStatus],
    ['ImportKind', Prisma.ImportKind, Shared.ImportKind],
    ['ImportStatus', Prisma.ImportStatus, Shared.ImportStatus],
    ['PaymentMethodKind', Prisma.PaymentMethodKind, Shared.PaymentMethodKind],
    ['BeneficiaryKind', Prisma.BeneficiaryKind, Shared.BeneficiaryKind],
    ['PayeeType', Prisma.PayeeType, Shared.PayeeType],
    ['MessageChannel', Prisma.MessageChannel, Shared.MessageChannel],
    ['OutboundStatus', Prisma.OutboundStatus, Shared.OutboundStatus],
  ];

  it.each(pairs)('%s', (_name, prismaEnum, sharedEnum) => {
    expect(Object.values(sharedEnum).sort()).toEqual(Object.values(prismaEnum).sort());
  });

  it('covers every Prisma enum', () => {
    const prismaEnumNames = Object.keys(Prisma.$Enums).sort();
    expect(pairs.map(([name]) => name).sort()).toEqual(prismaEnumNames);
  });

  it('treats campaign categories as data, not as an enum', () => {
    expect(Object.keys(Prisma.$Enums)).not.toContain('CampaignType');
    expect(Object.keys(Prisma.$Enums)).not.toContain('CampaignCategory');
    expect(Object.keys(Shared)).not.toContain('CampaignType');
    expect(Object.keys(Shared)).not.toContain('CAMPAIGN_TYPES');
  });

  it('keeps demo-capable and receipt-capable methods inside PaymentMethod, never CASH', () => {
    for (const m of [...Shared.DEMO_PAYMENT_METHODS, ...Shared.RECEIPT_PAYMENT_METHODS]) {
      expect(Object.values(Prisma.PaymentMethod)).toContain(m);
      expect(m).not.toBe('CASH');
    }
  });
});

describe('normalizePhone', () => {
  it.each(['0944123456', '944123456', '00963944123456', '+963 944 123 456', '٠٩٤٤١٢٣٤٥٦'])(
    'normalises the Syrian format %s to +963',
    (input) => {
      expect(Shared.normalizePhone(input)).toBe('+963944123456');
    },
  );

  it('keeps an international diaspora number as is', () => {
    expect(Shared.normalizePhone('+4915100000007')).toBe('+4915100000007');
  });

  it('returns null for an invalid number', () => {
    expect(Shared.normalizePhone('12345')).toBeNull();
  });
});

describe('parseBeneficiaryImportRow', () => {
  it('normalises a valid row', () => {
    expect(
      Shared.parseBeneficiaryImportRow({
        fullName: '  أحمد الخطيب ',
        phone: '0944123456',
        nationalId: '٠٤٠ ١٠١ ٠٠٢٠١',
        otherPrograms: 'الرعاية، السلال; التعليم',
      }),
    ).toEqual({
      ok: true,
      data: {
        fullName: 'أحمد الخطيب',
        phone: '+963944123456',
        nationalId: '04010100201',
        localCouncil: undefined,
        otherPrograms: ['الرعاية', 'السلال', 'التعليم'],
      },
    });
  });

  it('reports every invalid field with a stable code', () => {
    expect(
      Shared.parseBeneficiaryImportRow({ fullName: 'ab', phone: '123', nationalId: '12ab' }),
    ).toEqual({
      ok: false,
      issues: [
        { field: 'fullName', message: 'name_too_short' },
        { field: 'phone', message: 'invalid_phone' },
        { field: 'nationalId', message: 'invalid_national_id' },
      ],
    });
  });
});

describe('formatMoney / formatNumber use Western digits in both languages', () => {
  const ARABIC_INDIC = /[٠-٩۰-۹]/;

  it('Arabic money: 0-9 with the Arabic currency text', () => {
    const text = Shared.formatMoney('3000000', 'SYP', 'ar');
    expect(text).not.toMatch(ARABIC_INDIC);
    expect(text).toContain('3,000,000');
  });

  it('counts in both languages', () => {
    expect(Shared.formatNumber(12400, 'ar')).toBe('12,400');
    expect(Shared.formatNumber(12400, 'en')).toBe('12,400');
  });
});
