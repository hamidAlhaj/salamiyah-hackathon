import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { CollectorPledge, CollectorPoint } from '../common/shared';
import { money } from '../common/utils/money';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const pledgeInclude = {
  campaign: { select: { titleAr: true } },
  collectionPoint: { select: { id: true, name: true, type: true, area: true } },
  verifications: { orderBy: { createdAt: 'asc' }, take: 1, select: { createdAt: true } },
} satisfies Prisma.PledgeInclude;

type Row = Prisma.PledgeGetPayload<{ include: typeof pledgeInclude }>;

/**
 * The collector («مسؤول نقطة جمع») side of cash donations, always scoped to the caller's own
 * collection points: a pledge at another point is reported as not found (404), never forbidden.
 * Confirming receipt hands the cash over to the council's books (COLLECTED + a PENDING
 * verification, «براءة ذمة»); it never verifies money or changes a campaign's balance.
 */
@Injectable()
export class CollectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly access: RoleAccessService,
  ) {}

  /** Where the caller collects: active points assigned to them. */
  private myPoints(actor: AuthenticatedUser): Prisma.CollectionPointWhereInput {
    return { isActive: true, collectors: { some: { id: actor.id } } };
  }

  async points(actor: AuthenticatedUser): Promise<CollectorPoint[]> {
    this.access.requireRole(actor, ['COLLECTOR']);
    const rows = await this.prisma.collectionPoint.findMany({
      where: this.myPoints(actor),
      select: {
        id: true,
        name: true,
        type: true,
        area: true,
        _count: { select: { pledges: { where: { status: 'PLEDGED', method: 'CASH' } } } },
      },
      orderBy: { name: 'asc' },
    });
    return rows.map(({ _count, ...p }) => ({ ...p, pendingCount: _count.pledges }));
  }

  /** Cash pledges waiting to be handed over at my points, oldest first. */
  async pending(actor: AuthenticatedUser): Promise<CollectorPledge[]> {
    this.access.requireRole(actor, ['COLLECTOR']);
    const rows = await this.prisma.pledge.findMany({
      where: {
        status: 'PLEDGED',
        method: 'CASH',
        isDemo: false,
        collectionPoint: this.myPoints(actor),
      },
      include: pledgeInclude,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return rows.map((r) => this.toView(r));
  }

  /** The reference the donor shows at the point; only cash pledges at my points are found. */
  async byReference(referenceNo: string, actor: AuthenticatedUser): Promise<CollectorPledge> {
    this.access.requireRole(actor, ['COLLECTOR']);
    const row = await this.prisma.pledge.findFirst({
      where: {
        referenceNo: referenceNo.trim().toUpperCase(),
        method: 'CASH',
        collectionPoint: this.myPoints(actor),
      },
      include: pledgeInclude,
    });
    if (!row) throw new NotFoundException('pledge_not_found');
    return this.toView(row);
  }

  /**
   * One tap «تأكيد الاستلام»: PLEDGED → COLLECTED, a PENDING verification for finance, recorded by
   * this collector. The donor gets an instant acknowledgement (not an official receipt).
   */
  async confirm(id: string, actor: AuthenticatedUser): Promise<CollectorPledge> {
    this.access.requireRole(actor, ['COLLECTOR']);
    const view = await this.prisma.$transaction(async (tx) => {
      const pledge = await tx.pledge.findFirst({
        where: { id, method: 'CASH', collectionPoint: this.myPoints(actor) },
        select: { id: true, status: true, isDemo: true },
      });
      if (!pledge) throw new NotFoundException('pledge_not_found');
      if (pledge.status === 'COLLECTED') throw new ConflictException('already_collected');
      if (pledge.status !== 'PLEDGED' || pledge.isDemo) {
        throw new ConflictException('pledge_not_awaiting_cash');
      }
      // Guarded update: a second tap racing the first changes nothing.
      const { count } = await tx.pledge.updateMany({
        where: { id, status: 'PLEDGED' },
        data: { status: 'COLLECTED', recordedById: actor.id },
      });
      if (count === 0) throw new ConflictException('already_collected');
      await tx.verification.create({ data: { pledgeId: id, status: 'PENDING' } });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'pledge.cash_collected',
          entityType: 'Pledge',
          entityId: id,
          before: { status: 'PLEDGED' },
          after: { status: 'COLLECTED' },
        },
        tx,
      );
      return this.toView(
        await tx.pledge.findUniqueOrThrow({ where: { id }, include: pledgeInclude }),
      );
    });
    await this.notifications.donationEvent({ type: 'pledge.cash_collected', pledgeId: id });
    return view;
  }

  /** What I handed over: pledges I confirmed and box totals I recorded, newest first. */
  async history(actor: AuthenticatedUser): Promise<CollectorPledge[]> {
    this.access.requireRole(actor, ['COLLECTOR']);
    const rows = await this.prisma.pledge.findMany({
      where: { recordedById: actor.id, method: 'CASH' },
      include: pledgeInclude,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toView(r));
  }

  private toView(r: Row): CollectorPledge {
    return {
      id: r.id,
      referenceNo: r.referenceNo,
      amount: money(r.amount),
      currency: r.currency,
      campaignTitle: r.campaign.titleAr,
      donorName: r.isAnonymousDisplay ? null : (r.donorName ?? null),
      status: r.status,
      channel: r.channel,
      collectionPoint: r.collectionPoint,
      createdAt: r.createdAt.toISOString(),
      handedOverAt: r.verifications[0]?.createdAt.toISOString() ?? null,
    };
  }
}
