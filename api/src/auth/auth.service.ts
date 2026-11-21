import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import type { AuthTokens, CurrentUser } from '../common/shared';
import type { JwtPayload } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** تسجيل متبرع فقط؛ حسابات الموظفين ينشئها الـADMIN. */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('phone_taken');
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone,
        passwordHash: await hash(dto.password, 10),
        role: 'DONOR',
        locale: dto.locale ?? 'ar',
      },
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    // نفس الرسالة للحالتين حتى لا نكشف وجود الرقم
    if (
      !user?.passwordHash ||
      !user.isActive ||
      !(await compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('invalid_credentials');
    }
    return this.issueTokens(user);
  }

  async me(userId: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      locale: user.locale,
    };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ??
        '8h') as JwtSignOptions['expiresIn'],
    });
    return { accessToken };
  }
}
