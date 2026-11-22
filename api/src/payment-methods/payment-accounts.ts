import type { CampaignPaymentAccount, PaymentMethodConfig } from '@prisma/client';
import type { PaymentAccount } from '../common/shared';

type ConfigRow = Pick<
  PaymentMethodConfig,
  | 'method'
  | 'kind'
  | 'labelAr'
  | 'labelEn'
  | 'accountName'
  | 'accountNumber'
  | 'instructionsAr'
  | 'instructionsEn'
  | 'allowsReceiptUpload'
  | 'allowsDemoCheckout'
>;
type OverrideRow = Pick<
  CampaignPaymentAccount,
  'method' | 'accountName' | 'accountNumber' | 'note'
>;

/**
 * Receiving accounts shown to donors: the active PaymentMethodConfig rows (already ordered), with a
 * campaign's override replacing the account name/number for its method. Overrides for a method that is
 * not active are ignored (a deactivated method is never offered).
 */
export function mergePaymentAccounts(
  configs: ConfigRow[],
  overrides: OverrideRow[],
  lang: 'ar' | 'en',
): PaymentAccount[] {
  const byMethod = new Map(overrides.map((o) => [o.method, o]));
  const en = lang === 'en';
  return configs.map((c) => {
    const override = byMethod.get(c.method);
    return {
      method: c.method,
      kind: c.kind,
      label: en ? c.labelEn : c.labelAr,
      accountName: override?.accountName ?? c.accountName,
      accountNumber: override?.accountNumber ?? c.accountNumber,
      instructions: (en ? c.instructionsEn : c.instructionsAr) ?? null,
      note: override?.note ?? null,
      source: override ? 'campaign' : 'default',
      allowsReceiptUpload: c.allowsReceiptUpload,
      allowsDemoCheckout: c.allowsDemoCheckout,
    };
  });
}
