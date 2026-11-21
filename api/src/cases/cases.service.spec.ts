import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import type { ListCasesQueryDto, PublishCaseDto, ReviewCaseDto } from './cases.dto';
import { CasesService } from './cases.service';

const user = (role: Role): AuthenticatedUser => ({
  id: '00000000-0000-0000-0000-000000000007',
  role,
});
const CASE_ID = '33333333-3333-3333-3333-333333333333';
const review = { decision: 'reject', reason: 'not eligible' } as ReviewCaseDto;
const publish = { redactedSummary: 'summary' } as unknown as PublishCaseDto;

function serviceWith(prisma: unknown) {
  return new CasesService(
    prisma as PrismaService,
    untouchable<StorageService>('storage'),
    untouchable<AuditService>('audit'),
    untouchable<ConfigService>('config'),
    new RoleAccessService(),
  );
}

describe('CasesService authorization', () => {
  describe.each(Object.values(Role).filter((r) => r !== Role.CASE_OFFICER))('%s', (role) => {
    const service = serviceWith(untouchable('prisma'));

    it('cannot review a case', async () => {
      await expect(service.review(CASE_ID, review, user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('cannot publish a case', async () => {
      await expect(service.publish(CASE_ID, publish, user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  it('CASE_OFFICER passes the role check (then gets 404 for an unknown case)', async () => {
    const tx = { case: { findUnique: jest.fn().mockResolvedValue(null) } };
    const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
    const officer = user(Role.CASE_OFFICER);
    await expect(serviceWith(prisma).review(CASE_ID, review, officer)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      serviceWith(prisma).publish(CASE_ID, publish, officer),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([Role.DONOR, Role.COLLECTOR, Role.FINANCE_VERIFIER])(
    '%s cannot list cases (beneficiary names are internal)',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).list({} as ListCasesQueryDto, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it.each([Role.DONOR, Role.COLLECTOR])(
    '%s cannot download private documents',
    async (role) => {
      await expect(
        serviceWith(untouchable('prisma')).documentFile(CASE_ID, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});
