import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { OutboundMessage, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { OutboxItem, OutboxTemplate, Paginated } from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MESSAGE_CHANNEL, type MessageChannelDriver } from './message-channel';
import type { ListOutboxQueryDto } from './outbox.dto';

type Row = OutboundMessage & { user: { fullName: string } | null };

/**
 * The WhatsApp outbox (ADMIN): queued messages are sent one tap at a time from the council phone
 * through the active MessageChannelDriver (`wa_link`: a prefilled wa.me link). Opening a message
 * marks it OPENED; nothing is sent by the server.
 */
@Injectable()
export class OutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
    @Inject(MESSAGE_CHANNEL) private readonly channel: MessageChannelDriver,
  ) {}

  async list(
    query: ListOutboxQueryDto,
    actor: AuthenticatedUser,
  ): Promise<Paginated<OutboxItem> & { queued: number }> {
    this.access.requireRole(actor, ['ADMIN']);
    const where: Prisma.OutboundMessageWhereInput = {
      ...(query.template ? { template: query.template } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const pageSize = query.pageSize ?? 30;
    const page = query.page ?? 1;
    const [rows, total, queued] = await Promise.all([
      this.prisma.outboundMessage.findMany({
        where,
        include: { user: { select: { fullName: true } } },
        // Queued first, oldest first, so the list reads in sending order.
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.outboundMessage.count({ where }),
      this.prisma.outboundMessage.count({ where: { status: 'QUEUED' } }),
    ]);
    return { items: rows.map((r) => this.toItem(r)), total, page, pageSize, queued };
  }

  /** "Next" mode: the oldest queued message (optionally of one kind), or null when none is left. */
  async next(template: OutboxTemplate | undefined, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const row = await this.prisma.outboundMessage.findFirst({
      where: { status: 'QUEUED', ...(template ? { template } : {}) },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return { item: row ? this.toItem(row) : null };
  }

  /** Staff opened the wa.me link for this message: QUEUED → OPENED (idempotent). */
  async markOpened(id: string, actor: AuthenticatedUser): Promise<OutboxItem> {
    this.access.requireRole(actor, ['ADMIN']);
    const row = await this.prisma.outboundMessage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('outbox_message_not_found');
    if (row.status === 'OPENED') {
      return this.toItem({ ...row, user: null });
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.outboundMessage.update({
        where: { id },
        data: { status: 'OPENED', openedAt: new Date() },
        include: { user: { select: { fullName: true } } },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'outbox.opened',
          entityType: 'OutboundMessage',
          entityId: id,
          after: { template: updated.template, channel: this.channel.name },
        },
        tx,
      );
      return this.toItem(updated);
    });
  }

  private toItem(r: Row): OutboxItem {
    return {
      id: r.id,
      template: r.template as OutboxTemplate,
      status: r.status,
      phone: r.phone,
      recipientName: r.user?.fullName ?? null,
      body: r.body,
      link: r.link,
      openUrl: this.channel.openUrl(r.phone, r.body),
      createdAt: r.createdAt.toISOString(),
      openedAt: r.openedAt?.toISOString() ?? null,
    };
  }
}
