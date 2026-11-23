import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdatePhoneDto } from './auth.dto';
import { toCurrentUser } from './session';

/**
 * The donor's own profile: add or change the phone (needed before donating, for WhatsApp receipts
 * and alerts) and the WhatsApp consent. Staff phones are login identifiers managed by an ADMIN.
 */
@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  async updatePhone(dto: UpdatePhoneDto, actor: AuthenticatedUser): Promise<CurrentUser> {
    this.access.requireRole(actor, ['DONOR']);
    const current = await this.prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
    const taken = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      select: { id: true },
    });
    if (taken && taken.id !== actor.id) throw new ConflictException('phone_taken');
    const whatsappOptIn = dto.whatsappOptIn ?? current.whatsappOptIn;
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: actor.id },
        data: { phone: dto.phone, whatsappOptIn },
      });
      // The number itself never goes into the audit log.
      await this.audit.log(
        {
          actorId: actor.id,
          action: current.phone ? 'user.phone_change' : 'user.phone_add',
          entityType: 'User',
          entityId: actor.id,
          before: { hadPhone: current.phone !== null, whatsappOptIn: current.whatsappOptIn },
          after: { hadPhone: true, whatsappOptIn },
        },
        tx,
      );
      return u;
    });
    return toCurrentUser(user);
  }
}
