import { Injectable } from '@nestjs/common';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PublicCollectionPoint } from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCollectionPointDto, CreateHospitalDto } from './lookups.controller';

@Injectable()
export class LookupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RoleAccessService,
  ) {}

  /** Any signed-in user. */
  hospitals() {
    return this.prisma.hospital.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
    });
  }

  createHospital(dto: CreateHospitalDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.hospital.create({ data: dto });
  }

  collectionPoints(actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'FINANCE_VERIFIER', 'STAFF']);
    return this.prisma.collectionPoint.findMany({
      orderBy: { name: 'asc' },
      include: { collectors: { select: { id: true, fullName: true } } },
    });
  }

  /**
   * Public: active collection points where a donor can hand over cash, grouped by the client by area.
   * Only public fields: never the collectors or the contact person.
   */
  activeCollectionPoints(): Promise<PublicCollectionPoint[]> {
    return this.prisma.collectionPoint.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, area: true },
      orderBy: [{ area: 'asc' }, { name: 'asc' }],
    });
  }

  /** A collector only ever sees the collection points assigned to them. */
  myCollectionPoints(actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['COLLECTOR']);
    return this.prisma.collectionPoint.findMany({
      where: { isActive: true, collectors: { some: { id: actor.id } } },
      orderBy: { name: 'asc' },
    });
  }

  createCollectionPoint(dto: CreateCollectionPointDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.collectionPoint.create({ data: dto });
  }
}
