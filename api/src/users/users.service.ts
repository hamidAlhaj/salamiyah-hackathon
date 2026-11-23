import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto, UpdateUserDto } from './users.dto';

const BCRYPT_ROUNDS = 10;

/** Never selects passwordHash. */
const userSelect = {
  id: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  collectionPoints: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  list(actor: AuthenticatedUser, role?: Role) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: userSelect,
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateUserDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const pointIds = unique(dto.collectionPointIds);
    if (pointIds.length && dto.role !== 'COLLECTOR')
      throw new ConflictException('collection_points_collector_only');
    if (await this.prisma.user.findUnique({ where: { phone: dto.phone } }))
      throw new ConflictException('phone_taken');
    await this.requirePoints(pointIds);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName.trim(),
          phone: dto.phone,
          passwordHash,
          role: dto.role,
          collectionPoints: pointIds.length
            ? { connect: pointIds.map((id) => ({ id })) }
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
          after: { role: user.role, collectionPointIds: pointIds },
        },
        tx,
      );
      return user;
    });
  }

  /**
   * Collection points belong to collectors only: assigning points to another role is refused, and
   * moving a collector to another role clears their points. An admin never demotes or deactivates
   * their own account (the council would be locked out of setup).
   */
  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const existing = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!existing) throw new NotFoundException('user_not_found');
    if (
      id === actor.id &&
      ((dto.role !== undefined && dto.role !== existing.role) || dto.isActive === false)
    )
      throw new ConflictException('cannot_change_own_account');

    const role = dto.role ?? existing.role;
    const pointIds = dto.collectionPointIds ? unique(dto.collectionPointIds) : undefined;
    if (pointIds?.length && role !== 'COLLECTOR')
      throw new ConflictException('collection_points_collector_only');
    if (pointIds) await this.requirePoints(pointIds);
    const clearPoints = role !== 'COLLECTOR' && existing.collectionPoints.length > 0;
    const nextPoints = clearPoints ? [] : pointIds;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName?.trim(),
          role: dto.role,
          isActive: dto.isActive,
          collectionPoints: nextPoints
            ? { set: nextPoints.map((cp) => ({ id: cp })) }
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
          before: snapshot(existing),
          after: snapshot(user),
        },
        tx,
      );
      return user;
    });
  }

  /** Every id must be an existing collection point (inactive ones may still be assigned). */
  private async requirePoints(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const found = await this.prisma.collectionPoint.count({ where: { id: { in: ids } } });
    if (found !== ids.length) throw new NotFoundException('collection_point_not_found');
  }
}

function unique(ids: string[] | undefined): string[] {
  return [...new Set(ids ?? [])];
}

function snapshot(u: {
  fullName: string;
  role: Role;
  isActive: boolean;
  collectionPoints: { id: string }[];
}) {
  return {
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    collectionPointIds: u.collectionPoints.map((p) => p.id),
  };
}
