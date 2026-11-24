import { createHmac } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { allocateDonorCode } from '../common/utils/donor-code';
import { PrismaService } from '../prisma/prisma.service';
import type { CompleteEmailRegistrationDto, StartEmailRegistrationDto } from './auth.dto';
import { issueSession } from './session';

const AUDIENCE = 'athar:email-registration';

interface RegistrationProof {
  email: string;
  locale: 'ar' | 'en';
}

@Injectable()
export class EmailRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  enabled(): boolean {
    return this.deliverySettings() !== null;
  }

  async start(dto: StartEmailRegistrationDto): Promise<{ accepted: true }> {
    const settings = this.deliverySettings();
    if (!settings) throw new ServiceUnavailableException('email_registration_disabled');
    const { email, locale = 'ar' } = dto;
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return { accepted: true };

    const token = await this.jwt.signAsync(
      { email, locale },
      { secret: this.signingKey(), algorithm: 'HS256', audience: AUDIENCE, expiresIn: '30m' },
    );
    const link = new URL('/register?method=email', settings.origin);
    link.hash = new URLSearchParams({ token }).toString();
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: settings.from,
          to: [email],
          subject:
            locale === 'ar' ? 'تأكيد بريدك الإلكتروني في أثر' : 'Verify your Athar email',
          text:
            locale === 'ar'
              ? `افتح الرابط خلال 30 دقيقة لتأكيد بريدك واختيار كلمة المرور.\n\n${link.href}`
              : `Open this link within 30 minutes to verify your email and choose a password.\n\n${link.href}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('Email provider rejected the request');
    } catch {
      throw new ServiceUnavailableException('email_delivery_unavailable');
    }
    return { accepted: true };
  }

  async complete(dto: CompleteEmailRegistrationDto) {
    const fullName = dto.fullName.trim();
    if (fullName.length < 3 || Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException('invalid_registration_details');
    }

    let proof: RegistrationProof;
    try {
      proof = await this.jwt.verifyAsync<RegistrationProof>(dto.token, {
        secret: this.signingKey(),
        algorithms: ['HS256'],
        audience: AUDIENCE,
      });
    } catch {
      throw new BadRequestException('email_registration_link_invalid');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const donor = await tx.user.create({
          data: {
            email: proof.email,
            fullName,
            passwordHash,
            role: 'DONOR',
            locale: proof.locale,
            donorCode: await allocateDonorCode(tx),
          },
        });
        await this.audit.log(
          {
            actorId: donor.id,
            entityType: 'User',
            entityId: donor.id,
            action: 'user.email_register',
          },
          tx,
        );
        return donor;
      });
      return issueSession(this.jwt, user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes('email')
      ) {
        throw new ConflictException('email_registration_already_completed');
      }
      throw error;
    }
  }

  private signingKey(): string {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_SECRET'))
      .update(AUDIENCE)
      .digest('hex');
  }

  private deliverySettings() {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('EMAIL_REGISTRATION_FROM')?.trim();
    if (!apiKey || !from) return null;
    try {
      const url = new URL(
        this.config.get<string>('EMAIL_REGISTRATION_ORIGIN') ?? 'http://localhost:3000',
      );
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) return null;
      return { apiKey, from, origin: url.origin };
    } catch {
      return null;
    }
  }
}
