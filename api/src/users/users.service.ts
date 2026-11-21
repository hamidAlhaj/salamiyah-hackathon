import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto, UpdateUserDto } from './users.controller';

const BCRYPT_ROUNDS = 10;

/** Never selects passwordHash. */
const userSelect = {
  id: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  collectionPoints: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  list(actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateUserDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    if (await this.prisma.user.findUnique({ where: { phone: dto.phone } }))
      throw new ConflictException('phone_taken');
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          passwordHash,
          role: dto.role,
          collectionPoints: dto.collectionPointIds
            ? { connect: dto.collectionPointIds.map((id) => ({ id })) }
            : undefined,
        },
        select: userSelect,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'user.create',
          entityType: 'User',
          entityId: user.id,
          after: { role: user.role },
        },
        tx,
      );
      return user;
    });
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          role: dto.role,
          isActive: dto.isActive,
          collectionPoints: dto.collectionPointIds
            ? { set: dto.collectionPointIds.map((cp) => ({ id: cp })) }
            : undefined,
        },
        select: userSelect,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'user.update',
          entityType: 'User',
          entityId: id,
          after: { role: user.role, isActive: user.isActive },
        },
        tx,
      );
      return user;
    });
  }
}
