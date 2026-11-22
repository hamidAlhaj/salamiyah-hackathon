import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { untouchable } from '../../test/untouchable';
import type { AuditService } from '../audit/audit.service';
import { RoleAccessService } from '../common/access/role-access.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ListVerificationsQueryDto } from './verifications.dto';
import { VerificationsService } from './verifications.service';

const user = (role: Role): AuthenticatedUser => ({
  id: `00000000-0000-0000-0000-00000000000${Object.values(Role).indexOf(role)}`,
  role,
});
const DISALLOWED = Object.values(Role).filter((r) => r !== Role.FINANCE_VERIFIER);
const VERIFICATION_ID = '11111111-1111-1111-1111-111111111111';

function serviceWith(prisma: unknown) {
  return new VerificationsService(
    prisma as PrismaService,
    untouchable<AuditService>('audit'),
    untouchable<NotificationsService>('notifications'),
    new RoleAccessService(),
  );
}

/** A prisma stub whose transaction finds the given verification (or none). */
function prismaFinding(verification: unknown) {
  const tx = { verification: { findUnique: jest.fn().mockResolvedValue(verification) } };
  return { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
}

describe('VerificationsService authorization', () => {
  describe.each(DISALLOWED)('%s', (role) => {
    const service = serviceWith(untouchable('prisma'));

    it('cannot list the verification queue', async () => {
      await expect(
        service.list({ status: 'PENDING' } as ListVerificationsQueryDto, user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('cannot approve', async () => {
      await expect(service.approve(VERIFICATION_ID, user(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('cannot reject', async () => {
      await expect(
        service.reject(VERIFICATION_ID, 'reason text', user(role)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('FINANCE_VERIFIER', () => {
    const verifier = user(Role.FINANCE_VERIFIER);

    it('passes the role check (then gets 404 for an unknown verification)', async () => {
      await expect(
        serviceWith(prismaFinding(null)).approve(VERIFICATION_ID, verifier),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        serviceWith(prismaFinding(null)).reject(VERIFICATION_ID, 'reason text', verifier),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('never verifies an entry they recorded themselves', async () => {
      const own = {
        status: 'PENDING',
        pledge: { recordedById: verifier.id, donorId: null, campaign: {} },
      };
      await expect(
        serviceWith(prismaFinding(own)).approve(VERIFICATION_ID, verifier),
      ).rejects.toThrow('cannot_verify_own_entry');
      await expect(
        serviceWith(prismaFinding(own)).reject(VERIFICATION_ID, 'reason text', verifier),
      ).rejects.toThrow('cannot_verify_own_entry');
    });

    it('refuses to verify a simulated («Demo») payment, so demo never reaches verifiedAmount', async () => {
      const demo = {
        status: 'PENDING',
        pledge: { isDemo: true, status: 'DEMO_CONFIRMED', donorId: 'x', campaign: {} },
      };
      const prisma = prismaFinding(demo);
      await expect(serviceWith(prisma).approve(VERIFICATION_ID, verifier)).rejects.toThrow(
        'demo_not_verifiable',
      );
    });
  });
});
