import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@prisma/client';

/** The caller, as reloaded from the DB by JwtStrategy.validate(). */
export interface AuthenticatedUser {
  id: string;
  role: Role;
}

/** Only use on routes behind JwtAuthGuard; it is the only trusted source of the caller. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
