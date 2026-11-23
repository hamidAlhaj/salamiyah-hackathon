import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RoleAccessService } from './role-access.service';

describe('RoleAccessService.requireRole', () => {
  const access = new RoleAccessService();
  const user = (role: Role) => ({ id: '00000000-0000-0000-0000-000000000001', role });

  it('passes when the role is allowed', () => {
    expect(() =>
      access.requireRole(user(Role.FINANCE_VERIFIER), [Role.FINANCE_VERIFIER]),
    ).not.toThrow();
    expect(() => access.requireRole(user(Role.ADMIN), [Role.STAFF, Role.ADMIN])).not.toThrow();
  });

  it('throws ForbiddenException with the stable role_not_allowed code otherwise', () => {
    expect(() => access.requireRole(user(Role.DONOR), [Role.FINANCE_VERIFIER])).toThrow(
      ForbiddenException,
    );
    expect(() => access.requireRole(user(Role.DONOR), [Role.FINANCE_VERIFIER])).toThrow(
      'role_not_allowed',
    );
  });

  it('denies everyone when the allowed list is empty', () => {
    for (const role of Object.values(Role)) {
      expect(() => access.requireRole(user(role), [])).toThrow(ForbiddenException);
    }
  });
});
