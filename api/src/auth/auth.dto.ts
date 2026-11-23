import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LIMITS } from '../common/shared';
import { NormalizePhone, PHONE_REGEX } from '../common/dto/transforms';

export class RegisterDto {
  @ApiProperty({ example: 'أحمد الخطيب' })
  @IsString()
  @Length(3, 120)
  fullName: string;

  @ApiProperty({ example: '0944123456', description: 'يُطبَّع إلى +963…' })
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  phone: string;

  @ApiProperty({ minLength: LIMITS.passwordMinLength })
  @IsString()
  @MinLength(LIMITS.passwordMinLength)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  locale?: 'ar' | 'en';

  @ApiPropertyOptional({
    default: false,
    description:
      'Consent to WhatsApp messages: receipts and new-campaign alerts (sent from the council phone)',
  })
  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}

export class LoginDto {
  @ApiProperty({ example: '0944123456' })
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  phone: string;

  @ApiProperty()
  @IsString()
  @MaxLength(72)
  password: string;
}

/** PATCH /auth/me/phone: the donor adds or changes their phone (same rules as registration). */
export class UpdatePhoneDto {
  @ApiProperty({ example: '0944123456', description: 'يُطبَّع إلى +963…' })
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  phone: string;

  @ApiPropertyOptional({
    description:
      'Consent to WhatsApp messages: receipts and new-campaign alerts (sent from the council phone)',
  })
  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}

export class MeResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null only for a Google sign-in donor who has not added a phone yet',
  })
  phone: string | null;

  @ApiProperty({
    enum: ['DONOR', 'CASE_OFFICER', 'FINANCE_VERIFIER', 'STAFF', 'ADMIN', 'COLLECTOR'],
  })
  role: string;

  @ApiProperty({ enum: ['ar', 'en'] })
  locale: string;

  @ApiProperty({ type: String, nullable: true, example: 'D-K7M2QX' })
  donorCode: string | null;

  @ApiProperty()
  whatsappOptIn: boolean;

  @ApiProperty({ description: 'The account is linked to a Google sign-in' })
  googleLinked: boolean;
}

export class GoogleSignInConfigDto {
  @ApiProperty({
    description: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL are set',
  })
  enabled: boolean;

  @ApiProperty({ type: String, nullable: true, example: 'http://localhost:3000' })
  callbackOrigin: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Bearer access token (8h)' })
  accessToken: string;

  @ApiProperty({ type: MeResponse })
  user: MeResponse;
}
