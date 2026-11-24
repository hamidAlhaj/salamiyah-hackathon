import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthResponse, CurrentUser } from '../common/shared';
import { allocateDonorCode } from '../common/utils/donor-code';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './auth.dto';
import { issueSession, toCurrentUser } from './session';

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
        whatsappOptIn: dto.whatsappOptIn ?? false,
        donorCode: await allocateDonorCode(this.prisma),
      },
    });
    return issueSession(this.jwt, user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const { phone, email, password } = dto;
    if (
      (!phone && !email) ||
      (phone && email) ||
      (email && Buffer.byteLength(password, 'utf8') > 72)
    ) {
      throw new UnauthorizedException('invalid_credentials');
    }
    const user = await this.prisma.user.findUnique({
      where: email ? { email } : { phone },
    });
    // Same error for every failure so the response never reveals whether the phone exists.
    if (
      !user?.passwordHash ||
      !user.isActive ||
      (email && user.role !== 'DONOR') ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('invalid_credentials');
    }
    return issueSession(this.jwt, user);
  }

  async me(userId: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toCurrentUser(user);
  }
}
