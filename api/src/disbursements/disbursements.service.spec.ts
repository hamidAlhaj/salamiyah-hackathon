import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import type { CreateDisbursementDto } from './disbursements.dto';
import { DisbursementsService } from './disbursements.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000009',
  role,
});
const dto = {
  campaignId: '22222222-2222-2222-2222-222222222222',
  amount: '1000',
} as unknown as CreateDisbursementDto;

function serviceWith(prisma: unknown) {
  return new DisbursementsService(
    prisma as PrismaService,
    untouchable<StorageService>('storage'),
    untouchable<AuditService>('audit'),
    new RoleAccessService(),
  );
}

describe('DisbursementsService.create authorization', () => {
  it.each(Object.values(Role).filter((r) => r !== Role.FINANCE_VERIFIER))(
    '%s cannot record a disbursement (no DB, file or audit access)',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).create(dto, undefined, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('FINANCE_VERIFIER passes the role check (then gets 404 for an unknown campaign)', async () => {
    const prisma = { campaign: { findUnique: jest.fn().mockResolvedValue(null) } };
    await expect(
      serviceWith(prisma).create(dto, undefined, user(Role.FINANCE_VERIFIER)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([Role.DONOR, Role.STAFF, Role.COLLECTOR])(
    '%s cannot read the disbursement history',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).listForCampaign(dto.campaignId, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});
