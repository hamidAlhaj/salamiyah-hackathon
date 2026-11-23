import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { NotificationView, OutboxTemplate } from '../common/shared';
import { money } from '../common/utils/money';
import type { DonationEvent, DonationEventType } from '../pledges/donation-events';
import { PrismaService } from '../prisma/prisma.service';
import { links } from './links';
import {
  allocationNote,
  donationMessage,
  urgentCampaignMessage,
  whatsappText,
} from './messages';

/** The outbox template of each donation event (the outbox screen filters by it). */
const TEMPLATES: Record<DonationEventType, OutboxTemplate> = {
  'pledge.created': 'donation.pledged',
  'pledge.demo_confirmed': 'donation.demo',
  'pledge.cash_pledged': 'donation.cash',
  'pledge.cash_collected': 'donation.collected',
  'pledge.receipt_uploaded': 'donation.received',
  'pledge.verified': 'receipt.issued',
  'pledge.rejected': 'receipt.rejected',
};

const URGENT = ['URGENT', 'VERY_URGENT'] as const;

/**
 * Instant notifications confirming receipt: an in-app Notification for the donor on every donation
 * event, plus a WhatsApp outbox message (OutboundMessage) when the donor has a phone and opted in.
 * Staff send outbox messages one tap at a time from the outbox screen (no WhatsApp API).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** The public web address used in WhatsApp links (the phone opens it in the browser). */
  private absolute(path: string): string {
    const base = (
      this.config.get<string>('PUBLIC_WEB_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
    return `${base}${path}`;
  }

  /**
   * Called after a donation change has committed. A failure here never undoes the donation: it is
   * logged (without phone numbers) and the donor still sees the pledge in «تبرعاتي».
   */
  async donationEvent(event: DonationEvent): Promise<void> {
    try {
      await this.recordDonationEvent(event);
    } catch (err) {
      this.logger.error(
        `donation event ${event.type} for pledge ${event.pledgeId} failed: ${err}`,
      );
    }
  }

  private async recordDonationEvent(event: DonationEvent): Promise<void> {
    const p = await this.prisma.pledge.findUnique({
      where: { id: event.pledgeId },
      include: {
        campaign: { select: { titleAr: true, titleEn: true } },
        collectionPoint: { select: { name: true, area: true } },
        donor: { select: { id: true, locale: true, phone: true, whatsappOptIn: true } },
      },
    });
    // Council and collector entries have no donor account: nothing to notify in the app.
    if (!p?.donor) return;
    const lang = p.donor.locale === 'en' ? 'en' : 'ar';
    const text = donationMessage(
      event.type,
      {
        referenceNo: p.referenceNo,
        amount: money(p.amount),
        currency: p.currency,
        method: p.method,
        campaignTitle: (lang === 'en' ? p.campaign.titleEn : null) ?? p.campaign.titleAr,
        collectionPoint: p.collectionPoint,
        officialReceiptNo: event.type === 'pledge.verified' ? p.officialReceiptNo : null,
        reason: event.reason,
      },
      lang,
    );
    const note = allocationNote(
      {
        fundShare: money(p.fundAmount),
        heldAmount: money(p.heldAmount),
        currency: p.currency,
      },
      lang,
    );
    if (note) text.body = `${text.body} ${note}`;
    const link =
      event.type === 'pledge.verified' && p.officialReceiptNo
        ? links.officialReceipt(p.officialReceiptNo)
        : links.myDonations();

    const writes: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.notification.create({
        data: {
          userId: p.donor.id,
          type: event.type,
          title: text.title,
          body: text.body,
          link,
        },
      }),
    ];
    if (p.donor.whatsappOptIn && p.donor.phone) {
      const url = this.absolute(link);
      writes.push(
        this.prisma.outboundMessage.create({
          data: {
            userId: p.donor.id,
            phone: p.donor.phone,
            template: TEMPLATES[event.type],
            body: whatsappText(text, url),
            link: url,
            relatedType: 'Pledge',
            relatedId: p.id,
          },
        }),
      );
    }
    await this.prisma.$transaction(writes);
  }

  /**
   * Urgent alert: when a campaign of any category goes public with priority URGENT or VERY_URGENT,
   * queue one WhatsApp message per opted-in donor («الخيرين») with the campaign link.
   * Returns how many messages were queued.
   */
  async campaignPublished(campaignId: string): Promise<number> {
    try {
      const c = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          slug: true,
          titleAr: true,
          titleEn: true,
          priority: true,
          status: true,
          targetAmount: true,
          currency: true,
        },
      });
      if (!c || c.status !== 'ACTIVE' || !(URGENT as readonly string[]).includes(c.priority)) {
        return 0;
      }
      const donors = await this.prisma.user.findMany({
        // A Google sign-in donor without a phone yet has nowhere to receive WhatsApp alerts.
        where: { role: 'DONOR', isActive: true, whatsappOptIn: true, phone: { not: null } },
        select: { id: true, phone: true, locale: true },
      });
      const url = this.absolute(links.campaign(c.slug));
      const rows = donors.flatMap(({ id, phone, locale }) => {
        if (!phone) return [];
        const lang = locale === 'en' ? 'en' : 'ar';
        const text = urgentCampaignMessage(
          {
            title: (lang === 'en' ? c.titleEn : null) ?? c.titleAr,
            priority: c.priority,
            targetAmount: money(c.targetAmount),
            currency: c.currency,
          },
          lang,
        );
        return [
          {
            userId: id,
            phone,
            template: 'campaign.urgent' as const,
            body: whatsappText(text, url),
            link: url,
            relatedType: 'Campaign',
            relatedId: c.id,
          },
        ];
      });
      if (rows.length === 0) return 0;
      const { count } = await this.prisma.outboundMessage.createMany({ data: rows });
      return count;
    } catch (err) {
      this.logger.error(`urgent alert for campaign ${campaignId} failed: ${err}`);
      return 0;
    }
  }

  async listMine(userId: string): Promise<NotificationView[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async unreadCount(userId: string): Promise<{ unread: number }> {
    return {
      unread: await this.prisma.notification.count({ where: { userId, readAt: null } }),
    };
  }

  async markRead(userId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
