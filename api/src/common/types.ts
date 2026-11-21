import type { Role } from '@prisma/client';

/** محتوى الـaccess token. */
export interface JwtPayload {
  sub: string;
  role: Role;
}

/** المستخدم المرفق بالطلب بعد JwtAuthGuard. */
export interface AuthUser {
  id: string;
  role: Role;
}

export interface RequestWithUser {
  user?: AuthUser;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}
