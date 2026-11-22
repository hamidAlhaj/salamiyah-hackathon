/**
 * A donor donation event, raised after the change is committed (PledgesService for the donor paths,
 * VerificationsService for the finance decision). NotificationsService.donationEvent turns each one
 * into an in-app notification and, for opted-in donors, a WhatsApp outbox message.
 */
export type DonationEventType =
  | 'pledge.created'
  | 'pledge.demo_confirmed'
  | 'pledge.cash_pledged'
  | 'pledge.receipt_uploaded'
  | 'pledge.verified'
  | 'pledge.rejected';

export interface DonationEvent {
  type: DonationEventType;
  pledgeId: string;
  /** pledge.rejected: the finance verifier's reason, shown to the donor. */
  reason?: string;
}
