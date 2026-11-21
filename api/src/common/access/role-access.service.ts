import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Service-layer authorization (b4f pattern): services call requireRole first thing.
 * There is no roles guard and no @Roles decorator.
 */
@Injectable()
export class RoleAccessService {
  requireRole(user: AuthenticatedUser, roles: readonly Role[]): void {
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('role_not_allowed');
    }
  }
}
