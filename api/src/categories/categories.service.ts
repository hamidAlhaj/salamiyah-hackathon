import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PublicCategory } from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

/** Fields ADMIN screens need; the behaviour flags are shown read-only. */
const adminSelect = {
  id: true,
  code: true,
  nameAr: true,
  nameEn: true,
  descriptionAr: true,
  descriptionEn: true,
  icon: true,
  sortOrder: true,
  isActive: true,
  isSystem: true,
  requiresMedicalCase: true,
  lockedPayeeHospital: true,
  supportsMonthlySponsorship: true,
  _count: { select: { campaigns: true } },
} satisfies Prisma.CampaignCategorySelect;

/**
 * Campaign categories are data. ADMIN manages names, icon, order and active state; the code is
 * immutable, behaviour flags cannot be set through the API (new categories are generic), and system
 * categories can be deactivated but never deleted.
 */
@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RoleAccessService,
  ) {}

  /** Public: active categories, ordered. Flags are internal and not returned. */
  async listPublic(lang: 'ar' | 'en'): Promise<PublicCategory[]> {
    const rows = await this.prisma.campaignCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
      select: {
        id: true,
        code: true,
        nameAr: true,
        nameEn: true,
        descriptionAr: true,
        descriptionEn: true,
        icon: true,
        sortOrder: true,
      },
    });
    const en = lang === 'en';
    return rows.map((c) => ({
      id: c.id,
      code: c.code,
      name: en ? c.nameEn : c.nameAr,
      description: (en ? c.descriptionEn : c.descriptionAr) ?? null,
      icon: c.icon,
      sortOrder: c.sortOrder,
    }));
  }

  listAll(actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    return this.prisma.campaignCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
      select: adminSelect,
    });
  }

  async create(dto: CreateCategoryDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const exists = await this.prisma.campaignCategory.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('category_code_taken');
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.campaignCategory.create({
        data: {
          code: dto.code,
          nameAr: dto.nameAr.trim(),
          nameEn: dto.nameEn.trim(),
          descriptionAr: dto.descriptionAr?.trim(),
          descriptionEn: dto.descriptionEn?.trim(),
          icon: dto.icon,
          sortOrder: dto.sortOrder ?? 100,
          // New categories never get behaviour flags or system status.
          isSystem: false,
          requiresMedicalCase: false,
          lockedPayeeHospital: false,
          supportsMonthlySponsorship: false,
        },
        select: adminSelect,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'category.create',
          entityType: 'CampaignCategory',
          entityId: category.id,
          after: { code: category.code, icon: category.icon },
        },
        tx,
      );
      return category;
    });
  }

  async update(id: string, dto: UpdateCategoryDto, actor: AuthenticatedUser) {
    this.access.requireRole(actor, ['ADMIN']);
    const before = await this.prisma.campaignCategory.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('category_not_found');
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.campaignCategory.update({
        where: { id },
        data: {
          nameAr: dto.nameAr?.trim(),
          nameEn: dto.nameEn?.trim(),
          descriptionAr: dto.descriptionAr?.trim(),
          descriptionEn: dto.descriptionEn?.trim(),
          icon: dto.icon,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
        select: adminSelect,
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: dto.isActive === undefined ? 'category.update' : 'category.set_active',
          entityType: 'CampaignCategory',
          entityId: id,
          before: { nameAr: before.nameAr, icon: before.icon, isActive: before.isActive },
          after: { nameAr: after.nameAr, icon: after.icon, isActive: after.isActive },
        },
        tx,
      );
      return after;
    });
  }

  /** Only a non-system category with no campaigns can be deleted; otherwise deactivate it. */
  async remove(id: string, actor: AuthenticatedUser): Promise<{ ok: true }> {
    this.access.requireRole(actor, ['ADMIN']);
    const category = await this.prisma.campaignCategory.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        isSystem: true,
        _count: { select: { campaigns: true } },
      },
    });
    if (!category) throw new NotFoundException('category_not_found');
    if (category.isSystem) throw new ConflictException('system_category_cannot_be_deleted');
    if (category._count.campaigns > 0) throw new ConflictException('category_in_use');
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignCategory.delete({ where: { id } });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'category.delete',
          entityType: 'CampaignCategory',
          entityId: id,
          before: { code: category.code },
        },
        tx,
      );
    });
    return { ok: true };
  }
}
