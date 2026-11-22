import { Prisma } from '@prisma/client';
import type { CampaignLedger } from '../common/shared';
import { money } from '../common/utils/money';

export interface LedgerInput {
  campaignId: string;
  currency: CampaignLedger['currency'];
  targetAmount: Prisma.Decimal;
  /** Stored on the campaign: real money approved by a FINANCE_VERIFIER. */
  verifiedAmount: Prisma.Decimal;
  /** Stored on the campaign: the sum of expenditures. */
  spentAmount: Prisma.Decimal;
  /** Aggregated: receipts uploaded + cash collected, not yet verified. */
  pending?: Prisma.Decimal;
  /** Aggregated: simulated payments («Demo»). */
  demo?: Prisma.Decimal;
  donorsCount?: number;
  beneficiariesCount?: number;
}

/**
 * The campaign account: remaining = verified − spent. Pending and demo money are reported next to it
 * and never added to verified, spent or remaining.
 */
export function computeLedger(input: LedgerInput): CampaignLedger {
  const zero = new Prisma.Decimal(0);
  return {
    campaignId: input.campaignId,
    currency: input.currency,
    targetAmount: money(input.targetAmount),
    verifiedAmount: money(input.verifiedAmount),
    pendingAmount: money(input.pending ?? zero),
    demoAmount: money(input.demo ?? zero),
    spentAmount: money(input.spentAmount),
    remainingAmount: money(input.verifiedAmount.minus(input.spentAmount)),
    donorsCount: input.donorsCount ?? 0,
    beneficiariesCount: input.beneficiariesCount ?? 0,
  };
}
