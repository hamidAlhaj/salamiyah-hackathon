import type { PaymentMethodConfig } from '@prisma/client';
import { mergePaymentAccounts } from './payment-accounts';

const config = (over: Partial<PaymentMethodConfig>): PaymentMethodConfig => ({
  id: 'x',
  method: 'SYRIATEL_CASH',
  kind: 'WALLET',
  labelAr: 'سيريتل كاش',
  labelEn: 'Syriatel Cash',
  accountName: 'المجلس المحلي في السلمية (تجريبي)',
  accountNameEn: 'Salamiyah Local Council (demo)',
  accountNumber: '0930 000 002 (FAKE)',
  instructionsAr: 'تعليمات',
  instructionsEn: 'Instructions',
  allowsReceiptUpload: true,
  allowsDemoCheckout: true,
  isActive: true,
  sortOrder: 0,
  updatedAt: new Date(),
  ...over,
});

describe('mergePaymentAccounts (campaign receiving details)', () => {
  const configs = [
    config({ method: 'BEMO_TRANSFER', kind: 'TRANSFER', allowsDemoCheckout: true }),
    config({ method: 'SYRIATEL_CASH' }),
    config({
      method: 'VISA',
      kind: 'CARD',
      accountName: null,
      accountNumber: null,
      allowsReceiptUpload: false,
    }),
  ];

  it('returns the defaults in config order when the campaign has no override', () => {
    const accounts = mergePaymentAccounts(configs, [], 'ar');
    expect(accounts.map((a) => a.method)).toEqual(['BEMO_TRANSFER', 'SYRIATEL_CASH', 'VISA']);
    expect(accounts.every((a) => a.source === 'default')).toBe(true);
    expect(accounts[1]).toMatchObject({ label: 'سيريتل كاش', instructions: 'تعليمات' });
  });

  it('replaces the account of an overridden method only', () => {
    const accounts = mergePaymentAccounts(
      configs,
      [
        {
          method: 'SYRIATEL_CASH',
          accountName: 'Roof fund (demo)',
          accountNumber: '0930 000 099 (FAKE)',
          note: 'This campaign only',
        },
      ],
      'en',
    );
    const syriatel = accounts.find((a) => a.method === 'SYRIATEL_CASH');
    expect(syriatel).toMatchObject({
      source: 'campaign',
      accountName: 'Roof fund (demo)',
      accountNumber: '0930 000 099 (FAKE)',
      note: 'This campaign only',
      label: 'Syriatel Cash',
    });
    expect(accounts.find((a) => a.method === 'BEMO_TRANSFER')?.source).toBe('default');
  });

  it('ignores an override for a method that is not active (not in the config list)', () => {
    const accounts = mergePaymentAccounts(
      configs,
      [{ method: 'MTN_CASH', accountName: 'x', accountNumber: 'y', note: null }],
      'ar',
    );
    expect(accounts.map((a) => a.method)).not.toContain('MTN_CASH');
  });

  it('shows the account holder name in the UI language', () => {
    const ar = mergePaymentAccounts(configs, [], 'ar').find(
      (a) => a.method === 'SYRIATEL_CASH',
    );
    const en = mergePaymentAccounts(configs, [], 'en').find(
      (a) => a.method === 'SYRIATEL_CASH',
    );
    expect(ar?.accountName).toBe('المجلس المحلي في السلمية (تجريبي)');
    expect(en?.accountName).toBe('Salamiyah Local Council (demo)');
  });

  it('flags demo-capable and receipt-capable methods', () => {
    const visa = mergePaymentAccounts(configs, [], 'ar').find((a) => a.method === 'VISA');
    expect(visa).toMatchObject({ allowsDemoCheckout: true, allowsReceiptUpload: false });
  });
});
