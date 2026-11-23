import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import type { AuthResponse } from '../common/shared';
import { allocateDonorCode } from '../common/utils/donor-code';
import { PrismaService } from '../prisma/prisma.service';
import { issueSession } from './session';

/** What Google tells us about the person (see googleIdentity in google.strategy.ts). */
export interface GoogleIdentity {
  /** Google's stable account id ("sub"); the only key a Google sign-in is matched on. */
  sub: string;
  /** Lower-cased, and only when Google marked it verified. */
  email: string | null;
  name: string | null;
  locale: 'ar' | 'en';
}

const NAME_MAX = 120;

/**
 * Sign in with Google → the same app session as phone + password. Matching rules:
 * 1. an account already linked to this Google id signs in;
 * 2. otherwise a DONOR account with the same verified email is linked once (audited); staff,
 *    collector and admin accounts are never linked or entered through Google (`google_staff_account`);
 * 3. otherwise a new DONOR is created without phone and password. Donating then needs a phone
 *    (`phone_required`), added on the profile page.
 */
@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async signIn(google: GoogleIdentity): Promise<AuthResponse> {
    const linked = await this.prisma.user.findUnique({ where: { googleSub: google.sub } });
    if (linked) {
      if (linked.role !== 'DONOR') throw new ForbiddenException('google_staff_account');
      if (!linked.isActive) throw new UnauthorizedException('invalid_credentials');
      return issueSession(this.jwt, linked);
    }

    if (google.email) {
      const sameEmail = await this.prisma.user.findUnique({ where: { email: google.email } });
      if (sameEmail) {
        if (sameEmail.role !== 'DONOR') throw new ForbiddenException('google_staff_account');
        if (!sameEmail.isActive) throw new UnauthorizedException('invalid_credentials');
        // The email belongs to an account linked to a different Google id: never re-link silently.
        if (sameEmail.googleSub) throw new ConflictException('google_account_mismatch');
        const user = await this.prisma.$transaction(async (tx) => {
          const u = await tx.user.update({
            where: { id: sameEmail.id },
            data: { googleSub: google.sub },
          });
          await this.audit.log(
            {
              actorId: u.id,
              action: 'user.google_link',
              entityType: 'User',
              entityId: u.id,
              after: { googleLinked: true },
            },
            tx,
          );
          return u;
        });
        return issueSession(this.jwt, user);
      }
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          fullName: displayName(google),
          phone: null,
          email: google.email,
          googleSub: google.sub,
          passwordHash: null,
          role: 'DONOR',
          locale: google.locale,
          whatsappOptIn: false,
          donorCode: await allocateDonorCode(tx),
        },
      });
      await this.audit.log(
        {
          actorId: u.id,
          action: 'user.google_register',
          entityType: 'User',
          entityId: u.id,
          after: { role: 'DONOR', googleLinked: true },
        },
        tx,
      );
      return u;
    });
    return issueSession(this.jwt, user);
  }
}

/** Google's display name, else the email's local part, else a neutral placeholder. */
function displayName(google: GoogleIdentity): string {
  const name = google.name ?? google.email?.split('@')[0] ?? '';
  const trimmed = name.trim().slice(0, NAME_MAX);
  return trimmed.length >= 2
    ? trimmed
    : google.locale === 'en'
      ? 'Google donor'
      : 'متبرع Google';
}
