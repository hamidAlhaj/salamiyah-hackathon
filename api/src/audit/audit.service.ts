import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
}
