import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** يقيّد الـendpoint بأدوار محددة ويوثّق ذلك في Swagger. */
export function Roles(...roles: Role[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'يحتاج تسجيل دخول' }),
    ApiForbiddenResponse({ description: `مسموح لـ: ${roles.join(', ')}` }),
  );
}

/** أي مستخدم مسجّل. */
export function Authenticated(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'يحتاج تسجيل دخول' }),
  );
}
