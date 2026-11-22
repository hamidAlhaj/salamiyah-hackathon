import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { officialReceiptNo } from '../common/utils/codes';
import { money } from '../common/utils/money';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ListVerificationsQueryDto } from './verifications.dto';

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly access: RoleAccessService,
  ) {}

  /** قائمة الانتظار — الأقدم أولاً، مع التعهد والإيصال جنباً إلى جنب (FR-15). */
  async list(query: ListVerificationsQueryDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['FINANCE_VERIFIER']);
    const rows = await this.prisma.verification.findMany({
      where: { status: query.status },
      orderBy: { createdAt: query.status === 'PENDING' ? 'asc' : 'desc' },
      take: 100,
      include: {
        receipt: { select: { id: true, mimeType: true, transferRef: true, createdAt: true } },
        reviewer: { select: { fullName: true } },
        pledge: {
          include: {
            campaign: { select: { id: true, slug: true, titleAr: true } },
            collectionPoint: { select: { name: true, type: true, contactName: true } },
            recordedBy: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });
    return rows.map((v) => ({
      id: v.id,
      status: v.status,
      reason: v.reason,
      createdAt: v.createdAt.toISOString(),
      decidedAt: v.decidedAt?.toISOString() ?? null,
      reviewer: v.reviewer?.fullName ?? null,
      receipt: v.receipt,
      pledge: {
        id: v.pledge.id,
        referenceNo: v.pledge.referenceNo,
        amount: money(v.pledge.amount),
        currency: v.pledge.currency,
        channel: v.pledge.channel,
        method: v.pledge.method,
        donorName: v.pledge.donorName,
        donorPhone: v.pledge.donorPhone,
        campaign: v.pledge.campaign,
        collectionPoint: v.pledge.collectionPoint,
        recordedBy: v.pledge.recordedBy,
        createdAt: v.pledge.createdAt.toISOString(),
      },
    }));
  }

  /**
   * الاعتماد: transaction واحدة — التحقق، التعهد، رقم الإيصال الرسمي، رصيد الحملة، السجل، الإشعار.
   * فصل الصلاحيات: لا يعتمد المدقق تعهداً سجّله أو تبرّع به بنفسه (NFR-04).
   */
  async approve(id: string, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['FINANCE_VERIFIER']);
    const result = await this.prisma.$transaction(
      async (tx) => {
        const v = await tx.verification.findUnique({
          where: { id },
          include: { pledge: { include: { campaign: true } } },
        });
        if (!v) throw new NotFoundException('verification_not_found');
        if (v.status !== 'PENDING') throw new ConflictException('already_decided');
        const { pledge } = v;
        // Simulated («Demo») money is never verified: it must not reach verifiedAmount.
        if (pledge.isDemo) throw new ConflictException('demo_not_verifiable');
        if (pledge.recordedById === actor.id || pledge.donorId === actor.id) {
          throw new ForbiddenException('cannot_verify_own_entry');
        }
        if (!['RECEIPT_UPLOADED', 'COLLECTED'].includes(pledge.status))
          throw new ConflictException('pledge_not_pending');

        // إيصال رسمي باسم المتبرع للمنصة والمجلس؛ حصيلة الصناديق بلا إيصال فردي (قرار الفريق)
        let receiptNo: string | null = null;
        if (pledge.channel !== 'COLLECTOR') {
          const [seq] = await tx.$queryRaw<
            { nextval: bigint }[]
          >`SELECT nextval('official_receipt_seq')`;
          receiptNo = officialReceiptNo(Number(seq?.nextval ?? 0));
        }

        const now = new Date();
        await tx.verification.update({
          where: { id },
          data: { status: 'APPROVED', reviewerId: actor.id, decidedAt: now },
        });
        await tx.pledge.update({
          where: { id: pledge.id },
          data: { status: 'VERIFIED', verifiedAt: now, officialReceiptNo: receiptNo },
        });
        const campaign = await tx.campaign.update({
          where: { id: pledge.campaignId },
          data: { verifiedAmount: { increment: pledge.amount } },
        });
        if (
          campaign.status === 'ACTIVE' &&
          campaign.verifiedAmount.greaterThanOrEqualTo(campaign.targetAmount)
        ) {
          await tx.campaign.update({ where: { id: campaign.id }, data: { status: 'FUNDED' } });
        }

        await this.audit.log(
          {
            actorId: actor.id,
            action: 'pledge.verify',
            entityType: 'Pledge',
            entityId: pledge.id,
            before: { status: pledge.status },
            after: {
              status: 'VERIFIED',
              officialReceiptNo: receiptNo,
              campaignVerified: money(campaign.verifiedAmount),
            },
          },
          tx,
        );
        return {
          id,
          pledgeId: pledge.id,
          officialReceiptNo: receiptNo,
          campaignVerifiedAmount: money(campaign.verifiedAmount),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    // After commit: the donor's "verified" notification (+ WhatsApp outbox when opted in).
    await this.notifications.donationEvent({
      type: 'pledge.verified',
      pledgeId: result.pledgeId,
    });
    return result;
  }

  async reject(id: string, reason: string, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['FINANCE_VERIFIER']);
    const result = await this.prisma.$transaction(async (tx) => {
      const v = await tx.verification.findUnique({
        where: { id },
        include: { pledge: { include: { campaign: true } } },
      });
      if (!v) throw new NotFoundException('verification_not_found');
      if (v.status !== 'PENDING') throw new ConflictException('already_decided');
      if (v.pledge.recordedById === actor.id || v.pledge.donorId === actor.id) {
        throw new ForbiddenException('cannot_verify_own_entry');
      }
      await tx.verification.update({
        where: { id },
        data: { status: 'REJECTED', reason, reviewerId: actor.id, decidedAt: new Date() },
      });
      await tx.pledge.update({ where: { id: v.pledge.id }, data: { status: 'REJECTED' } });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'pledge.reject',
          entityType: 'Pledge',
          entityId: v.pledge.id,
          before: { status: v.pledge.status },
          after: { status: 'REJECTED', reason },
        },
        tx,
      );
      return { id, pledgeId: v.pledge.id, status: 'REJECTED' as const };
    });
    // After commit: the reason and a link to «تبرعاتي», where the donor uploads a new receipt.
    await this.notifications.donationEvent({
      type: 'pledge.rejected',
      pledgeId: result.pledgeId,
      reason,
    });
    return result;
  }
}
