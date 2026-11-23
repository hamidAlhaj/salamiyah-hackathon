import type { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { AuthResponse, CurrentUser } from '../common/shared';
import type { JwtPayload } from './jwt.strategy';

/**
 * The one app session every sign-in method returns: an 8h Bearer token (secret and expiry from the
 * JwtModule config: JWT_SECRET, JWT_EXPIRES_IN) and the current user.
 */
export async function issueSession(jwt: JwtService, user: User): Promise<AuthResponse> {
  const payload: JwtPayload = { sub: user.id, role: user.role };
  const accessToken = await jwt.signAsync(payload);
  return { accessToken, user: toCurrentUser(user) };
}

/** Never exposes passwordHash, email or googleSub. */
export function toCurrentUser(user: User): CurrentUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    locale: user.locale,
    donorCode: user.donorCode,
    whatsappOptIn: user.whatsappOptIn,
    googleLinked: user.googleSub !== null,
  };
}
