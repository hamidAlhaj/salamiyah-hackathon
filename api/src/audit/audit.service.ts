import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Role } from '@prisma/client';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}

/** One row of a history panel (ADMIN). Personal fields are masked even there. */
export interface AuditHistoryItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  /** Pledge rows: the pledge reference (P-XXXXXX), so the panel can name it. */
  reference: string | null;
  actor: { fullName: string; role: Role } | null;
  before: Prisma.JsonValue | null;
  after: Prisma.JsonValue | null;
  createdAt: string;
}

const HISTORY_LIMIT = 200;
/** Keys whose values never appear in a history panel (phones, national IDs, private names). */
const PERSONAL_KEY = /phone|nationalid|password|fullname|donorname/i;
export const MASK = '•••';

/** Masks personal values at any depth, so no audit payload can show a phone or national ID. */
export function maskPersonal(value: Prisma.JsonValue | null): Prisma.JsonValue | null {
  if (Array.isArray(value)) return value.map((v) => maskPersonal(v));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        PERSONAL_KEY.test(k) ? MASK : maskPersonal(v ?? null),
      ]),
    );
  }
  return value;
}

/** سجل تدقيق للقراءة فقط (FR-24). يُستدعى داخل نفس الـtransaction للتغيير. */
@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RoleAccessService,
  ) {}

  async log(entry: AuditEntry, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.auditLog.create({ data: entry });
  }

  list(user: AuthenticatedUser, entityType: string, entityId: string) {
    this.access.requireRole(user, ['ADMIN']);
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, fullName: true, role: true } } },
    });
  }

  /**
   * History panel of a campaign (ADMIN): the campaign's own rows (edits, status, spending, links,
   * accounts), its medical case's rows and its pledges' rows (verification, cash, rejection).
   */
  async campaignHistory(user: AuthenticatedUser, id: string): Promise<AuditHistoryItem[]> {
    this.access.requireRole(user, ['ADMIN']);
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      select: { id: true, caseId: true, pledges: { select: { id: true, referenceNo: true } } },
    });
    if (!campaign) throw new NotFoundException('campaign_not_found');
    const refs = new Map(campaign.pledges.map((p) => [p.id, p.referenceNo]));
    return this.history(
      [
        { entityType: 'Campaign', entityId: campaign.id },
        ...(campaign.caseId ? [{ entityType: 'Case', entityId: campaign.caseId }] : []),
        ...(refs.size ? [{ entityType: 'Pledge', entityId: { in: [...refs.keys()] } }] : []),
      ],
      refs,
    );
  }

  /** History panel of a case (ADMIN): the case's rows and, once published, its campaign's rows. */
  async caseHistory(user: AuthenticatedUser, id: string): Promise<AuditHistoryItem[]> {
    this.access.requireRole(user, ['ADMIN']);
    const found = await this.prisma.case.findUnique({
      where: { id },
      select: { id: true, campaign: { select: { id: true } } },
    });
    if (!found) throw new NotFoundException('case_not_found');
    return this.history(
      [
        { entityType: 'Case', entityId: found.id },
        ...(found.campaign ? [{ entityType: 'Campaign', entityId: found.campaign.id }] : []),
      ],
      new Map(),
    );
  }

  private async history(
    where: Prisma.AuditLogWhereInput[],
    refs: Map<string, string>,
  ): Promise<AuditHistoryItem[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { OR: where },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      include: { actor: { select: { fullName: true, role: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      reference: r.entityType === 'Pledge' ? (refs.get(r.entityId) ?? null) : null,
      actor: r.actor,
      before: maskPersonal(r.before),
      after: maskPersonal(r.after),
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
