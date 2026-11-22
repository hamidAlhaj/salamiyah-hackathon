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

export class MeResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({
    enum: ['DONOR', 'CASE_OFFICER', 'FINANCE_VERIFIER', 'STAFF', 'ADMIN', 'COLLECTOR'],
  })
  role: string;

  @ApiProperty({ enum: ['ar', 'en'] })
  locale: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Bearer access token (8h)' })
  accessToken: string;

  @ApiProperty({ type: MeResponse })
  user: MeResponse;
}
