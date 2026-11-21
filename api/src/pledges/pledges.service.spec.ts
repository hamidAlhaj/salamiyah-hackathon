import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import type { CollectorPledgeDto, CouncilPledgeDto } from './pledges.dto';
import { PledgesService } from './pledges.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000005',
  role,
});
const collectorDto = {
  campaignId: '44444444-4444-4444-4444-444444444444',
  collectionPointId: '55555555-5555-5555-5555-555555555555',
  amount: '750000',
} as unknown as CollectorPledgeDto;

function serviceWith(prisma: unknown) {
  return new PledgesService(
    prisma as PrismaService,
    untouchable<StorageService>('storage'),
    untouchable<AuditService>('audit'),
    untouchable<NotificationsService>('notifications'),
    untouchable<ConfigService>('config'),
    new RoleAccessService(),
  );
}

describe('PledgesService collector scoping', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.COLLECTOR))(
    '%s cannot record a collection-point pledge',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).createCollector(collectorDto, user(role)),
      ).rejects.toThrow('role_not_allowed');
    },
  );

  it('a COLLECTOR cannot record for a collection point that is not assigned to them', async () => {
    const collector = user(Role.COLLECTOR);
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = serviceWith({ collectionPoint: { findFirst } });

    const result = service.createCollector(collectorDto, collector);

    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.createCollector(collectorDto, collector)).rejects.toThrow(
      'collection_point_not_assigned',
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: collectorDto.collectionPointId,
        isActive: true,
        collectors: { some: { id: collector.id } },
      },
    });
  });

  it('a COLLECTOR cannot record council (in-person) pledges', async () => {
    await expect(
      serviceWith(untouchable('prisma')).createCouncil(
        {} as CouncilPledgeDto,
        user(Role.COLLECTOR),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([Role.STAFF, Role.FINANCE_VERIFIER, Role.ADMIN, Role.COLLECTOR])(
    '%s cannot use the donor-only "my donations" list',
    async (role) => {
      await expect(serviceWith(untouchable('prisma')).mine(user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    },
  );
});
