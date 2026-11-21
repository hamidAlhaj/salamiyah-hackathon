import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuthResponse, CurrentUser } from '../common/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './auth.dto';
import type { JwtPayload } from './jwt.strategy';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Donor self-registration only; staff accounts are created by an ADMIN. */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('phone_taken');
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone,
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        role: 'DONOR',
        locale: dto.locale ?? 'ar',
      },
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    // Same error for every failure so the response never reveals whether the phone exists.
    if (
      !user?.passwordHash ||
      !user.isActive ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('invalid_credentials');
    }
    return this.issueToken(user);
  }

  async me(userId: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toCurrentUser(user);
  }

  /** Secret and expiry (JWT_SECRET, JWT_EXPIRES_IN, default 8h) come from the JwtModule config. */
  private async issueToken(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, user: toCurrentUser(user) };
  }
}

function toCurrentUser(user: User): CurrentUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    locale: user.locale,
  };
}
