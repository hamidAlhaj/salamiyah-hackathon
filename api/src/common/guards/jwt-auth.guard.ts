import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload, RequestWithUser } from '../types';

/** Guard عام: كل endpoint يحتاج access token صالحاً إلا المعلّم بـ@Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(req);

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
        });
        req.user = { id: payload.sub, role: payload.role };
      } catch {
        if (!isPublic) throw new UnauthorizedException('invalid_token');
      }
    }

    if (isPublic) return true;
    if (!req.user) throw new UnauthorizedException();
    return true;
  }

  private extractToken(req: RequestWithUser): string | null {
    const header = req.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    if (!value?.startsWith('Bearer ')) return null;
    return value.slice(7);
  }
}
