import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { links } from '../notifications/links';
import { overdueCaseMessage } from '../notifications/messages';
import { PrismaService } from '../prisma/prisma.service';

const REVIEWABLE = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
/** How often the API looks for newly overdue cases (minutes; SLA_CHECK_MINUTES overrides). */
const DEFAULT_CHECK_MINUTES = 10;
/** The first check runs shortly after start-up, so a restarted API alerts without waiting. */
const FIRST_CHECK_MS = 5_000;

/**
 * SLA alerts (R20): a case still waiting for review after its deadline (`slaDueAt`) sends one in-app
 * notification to every active CASE_OFFICER and ADMIN, once per case (`overdueNotifiedAt`). A plain
 * timer inside the API (no scheduler library); the claim is a conditional update, so two API
 * processes never alert twice for the same case.
 */
@Injectable()
export class CaseSlaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CaseSlaService.name);
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const minutes = Number(
      this.config.get<string>('SLA_CHECK_MINUTES') ?? DEFAULT_CHECK_MINUTES,
    );
    if (!(minutes > 0)) return; // 0 turns the timer off (tests, scripts)
    const run = () => void this.notifyOverdue();
    this.timers = [setTimeout(run, FIRST_CHECK_MS), setInterval(run, minutes * 60_000)];
    // Never keep the process alive just for the timer.
    for (const t of this.timers) t.unref();
  }

  onModuleDestroy(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  /** Alerts for every newly overdue case; returns how many cases were alerted. Never throws. */
  async notifyOverdue(now = new Date()): Promise<number> {
    try {
      const due = await this.prisma.case.findMany({
        where: {
          status: { in: [...REVIEWABLE] },
          slaDueAt: { lt: now },
          overdueNotifiedAt: null,
        },
        select: { id: true, trackingNo: true, slaDueAt: true },
        orderBy: { slaDueAt: 'asc' },
        take: 50,
      });
      if (due.length === 0) return 0;
      const recipients = await this.prisma.user.findMany({
        where: { role: { in: ['CASE_OFFICER', 'ADMIN'] }, isActive: true },
        select: { id: true, locale: true },
      });
      let alerted = 0;
      for (const c of due) {
        const daysLate = Math.max(
          1,
          Math.floor((now.getTime() - (c.slaDueAt ?? now).getTime()) / DAY_MS),
        );
        const sent = await this.prisma.$transaction(async (tx) => {
          const claim = await tx.case.updateMany({
            where: { id: c.id, overdueNotifiedAt: null },
            data: { overdueNotifiedAt: now },
          });
          if (claim.count === 0) return false; // another process got there first
          if (recipients.length > 0) {
            await tx.notification.createMany({
              data: recipients.map((u) => {
                const text = overdueCaseMessage(
                  { trackingNo: c.trackingNo, daysLate },
                  u.locale === 'en' ? 'en' : 'ar',
                );
                return {
                  userId: u.id,
                  type: 'case.overdue',
                  title: text.title,
                  body: text.body,
                  link: links.staffCase(c.id),
                };
              }),
            });
          }
          await this.audit.log(
            {
              actorId: null,
              action: 'case.overdue_alert',
              entityType: 'Case',
              entityId: c.id,
              after: { daysLate, recipients: recipients.length },
            },
            tx,
          );
          return true;
        });
        if (sent) alerted += 1;
      }
      return alerted;
    } catch (err) {
      this.logger.error(`overdue check failed: ${err}`);
      return 0;
    }
  }
}
