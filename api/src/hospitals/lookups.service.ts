import { Injectable } from '@nestjs/common';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
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
