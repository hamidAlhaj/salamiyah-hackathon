/**
 * A donor donation event, raised by PledgesService after the change is committed. P11 turns each one
 * into an instant in-app notification and a WhatsApp outbox message (receipt confirmation).
 */
export interface DonationEvent {
  type:
    | 'pledge.created'
    | 'pledge.demo_confirmed'
    | 'pledge.cash_pledged'
    | 'pledge.receipt_uploaded';
  pledgeId: string;
}
