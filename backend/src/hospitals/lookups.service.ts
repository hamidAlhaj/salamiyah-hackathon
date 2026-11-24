import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PublicCollectionPoint } from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateCollectionPointDto,
  CreateHospitalDto,
  UpdateCollectionPointDto,
  UpdateHospitalDto,
} from './lookups.dto';

const trimmed = (v: string | undefined) => v?.trim();

@Injectable()
export class LookupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  /** Any signed-in user. */
  hospitals() {
    return this.prisma.hospital.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
    });
  }

  /** ADMIN setup list: inactive hospitals too, with how often each is used. */
  allHospitals(actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.hospital.findMany({
      orderBy: [{ isActive: 'desc' }, { nameAr: 'asc' }],
      include: { _count: { select: { cases: true, campaigns: true, expenditures: true } } },
    });
  }

  async createHospital(dto: CreateHospitalDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          nameAr: dto.nameAr.trim(),
          nameEn: trimmed(dto.nameEn),
          city: dto.city.trim(),
          isPrivate: dto.isPrivate ?? false,
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'hospital.create',
          entityType: 'Hospital',
          entityId: hospital.id,
          after: { nameAr: hospital.nameAr, city: hospital.city },
        },
        tx,
      );
      return hospital;
    });
  }

  /** Deactivating only hides the hospital from new cases; cases and campaigns keep their hospital. */
  async updateHospital(id: string, dto: UpdateHospitalDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const before = await this.prisma.hospital.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('hospital_not_found');
    return this.prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.update({
        where: { id },
        data: {
          nameAr: trimmed(dto.nameAr),
          nameEn: trimmed(dto.nameEn),
          city: trimmed(dto.city),
          isPrivate: dto.isPrivate,
          isActive: dto.isActive,
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'hospital.update',
          entityType: 'Hospital',
          entityId: id,
          before: { nameAr: before.nameAr, city: before.city, isActive: before.isActive },
          after: { nameAr: hospital.nameAr, city: hospital.city, isActive: hospital.isActive },
        },
        tx,
      );
      return hospital;
    });
  }

  collectionPoints(actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN', 'FINANCE_VERIFIER', 'STAFF']);
    return this.prisma.collectionPoint.findMany({
      orderBy: [{ isActive: 'desc' }, { area: 'asc' }, { name: 'asc' }],
      include: {
        collectors: { select: { id: true, fullName: true, isActive: true } },
        _count: { select: { pledges: true } },
      },
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

  async createCollectionPoint(dto: CreateCollectionPointDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.$transaction(async (tx) => {
      const point = await tx.collectionPoint.create({
        data: {
          name: dto.name.trim(),
          type: dto.type,
          contactName: trimmed(dto.contactName) || null,
          area: dto.area.trim(),
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'collection_point.create',
          entityType: 'CollectionPoint',
          entityId: point.id,
          after: { name: point.name, type: point.type, area: point.area },
        },
        tx,
      );
      return point;
    });
  }

  /** A deactivated point is no longer offered to donors nor shown to its collectors. */
  async updateCollectionPoint(
    id: string,
    dto: UpdateCollectionPointDto,
    actor: AuthenticatedUser,
  ) {
    this.access.requireRole(actor, ['ADMIN']);
    const before = await this.prisma.collectionPoint.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('collection_point_not_found');
    const contactName =
      dto.contactName === undefined ? undefined : dto.contactName.trim() || null;
    return this.prisma.$transaction(async (tx) => {
      const point = await tx.collectionPoint.update({
        where: { id },
        data: {
          name: trimmed(dto.name),
          type: dto.type,
          contactName,
          area: trimmed(dto.area),
          isActive: dto.isActive,
        },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'collection_point.update',
          entityType: 'CollectionPoint',
          entityId: id,
          before: {
            name: before.name,
            type: before.type,
            area: before.area,
            isActive: before.isActive,
          },
          after: {
            name: point.name,
            type: point.type,
            area: point.area,
            isActive: point.isActive,
          },
        },
        tx,
      );
      return point;
    });
  }
}
