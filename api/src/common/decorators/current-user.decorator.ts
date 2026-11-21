import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthUser, RequestWithUser } from '../types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  },
);

/** المستخدم إن وُجد (لـendpoints عامة تتصرف بشكل مختلف للمسجّل). */
export const OptionalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | null => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    return req.user ?? null;
  },
);
