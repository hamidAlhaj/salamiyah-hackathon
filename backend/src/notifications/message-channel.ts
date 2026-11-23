import { whatsappShareUrl } from '../common/shared';

/**
 * How an outbox message reaches the donor. `wa_link` (now): staff open a prefilled wa.me link from
 * the council phone, one tap per message, no WhatsApp API. `cloud_api` (later, out of scope): a
 * driver that sends through the official WhatsApp Cloud API would implement the same interface.
 */
export interface MessageChannelDriver {
  readonly name: 'wa_link' | 'cloud_api';
  /** The URL staff open to send this message, or null when the driver sends by itself. */
  openUrl(phone: string, text: string): string | null;
}

export class WaLinkChannel implements MessageChannelDriver {
  readonly name = 'wa_link' as const;

  openUrl(phone: string, text: string): string {
    // wa.me wants the international number without "+" or spaces.
    return whatsappShareUrl(text, phone.replace(/[^\d+]/g, ''));
  }
}

/** Nest injection token for the active driver. */
export const MESSAGE_CHANNEL = Symbol('MESSAGE_CHANNEL');
