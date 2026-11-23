import { Prisma } from '@prisma/client';
import type { SurplusChoice } from '../common/shared';

/**
 * Surplus allocation rules for the general council fund (docs/fund-contract.md). Pure functions with
 * exact decimals; the service supplies the numbers read inside a locked transaction.
 */

/** An unpaid transfer pledge (PLEDGED) reserves its campaign share for this long. */
export const RESERVE_HOURS = 72;

const ZERO = new Prisma.Decimal(0);

export type AllocationState = 'WITHIN' | 'SURPLUS' | 'COMPLETE';

/** remaining = max(0, target − verified − reserved). */
export function remainingNeed(
  target: Prisma.Decimal,
  verified: Prisma.Decimal,
  reserved: Prisma.Decimal,
): Prisma.Decimal {
  const left = target.minus(verified).minus(reserved);
  return left.isNegative() ? ZERO : left;
}

export interface Quote {
  state: AllocationState;
  campaignShare: Prisma.Decimal;
  surplus: Prisma.Decimal;
}

/** The split shown to the donor before a pledge exists; `remaining` null = uncapped campaign. */
export function quote(offered: Prisma.Decimal, remaining: Prisma.Decimal | null): Quote {
  if (remaining === null || offered.lessThanOrEqualTo(remaining)) {
    return { state: 'WITHIN', campaignShare: offered, surplus: ZERO };
  }
  if (remaining.isZero()) return { state: 'COMPLETE', campaignShare: ZERO, surplus: offered };
  return { state: 'SURPLUS', campaignShare: remaining, surplus: offered.minus(remaining) };
}

export interface PledgePlan {
  amount: Prisma.Decimal;
  fundAmount: Prisma.Decimal;
}

/** Thrown codes (the service maps them to 409 Conflict). */
export type PlanError = 'campaign_complete' | 'surplus_choice_required' | 'allocation_changed';

/**
 * What a new pledge records. Within the remaining need nothing changes; above it the donor's choice
 * decides, and a stale `expectedCampaignShare` (another donation came first) is refused.
 */
export function planPledge(
  offered: Prisma.Decimal,
  remaining: Prisma.Decimal | null,
  choice?: SurplusChoice,
  expectedCampaignShare?: string,
): PledgePlan | PlanError {
  const q = quote(offered, remaining);
  if (q.state === 'WITHIN') return { amount: offered, fundAmount: ZERO };
  if (q.state === 'COMPLETE') return 'campaign_complete';
  if (!choice) return 'surplus_choice_required';
  if (expectedCampaignShare !== undefined && !q.campaignShare.equals(expectedCampaignShare)) {
    return 'allocation_changed';
  }
  return choice === 'REMAINING_ONLY'
    ? { amount: q.campaignShare, fundAmount: ZERO }
    : { amount: offered, fundAmount: q.surplus };
}

export interface ApprovalSplit {
  /** Added to the campaign's verified amount. */
  campaignCredit: Prisma.Decimal;
  /** Final fund share of the pledge (added to the fund's verified amount). */
  fundAmount: Prisma.Decimal;
  /** Verified money waiting for the donor's decision. */
  heldAmount: Prisma.Decimal;
}

/**
 * On finance approval the campaign never goes above its target. Extra money goes to the fund only when
 * the donor already accepted a fund share (SPLIT); otherwise it is held for the donor's decision.
 */
export function splitOnApproval(input: {
  amount: Prisma.Decimal;
  fundAmount: Prisma.Decimal;
  capped: boolean;
  target: Prisma.Decimal;
  verified: Prisma.Decimal;
}): ApprovalSplit {
  const share = input.amount.minus(input.fundAmount);
  if (!input.capped) {
    return { campaignCredit: share, fundAmount: input.fundAmount, heldAmount: ZERO };
  }
  const roomLeft = input.target.minus(input.verified);
  const room = roomLeft.isNegative() ? ZERO : roomLeft;
  const campaignCredit = Prisma.Decimal.min(share, room);
  const excess = share.minus(campaignCredit);
  if (excess.isZero())
    return { campaignCredit, fundAmount: input.fundAmount, heldAmount: ZERO };
  return input.fundAmount.greaterThan(0)
    ? { campaignCredit, fundAmount: input.fundAmount.plus(excess), heldAmount: ZERO }
    : { campaignCredit, fundAmount: input.fundAmount, heldAmount: excess };
}
