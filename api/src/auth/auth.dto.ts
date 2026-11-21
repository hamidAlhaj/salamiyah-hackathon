import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
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
  password: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  locale?: 'ar' | 'en';
}

export class LoginDto {
  @ApiProperty({ example: '0944123456' })
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  phone: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class TokensResponse {
  @ApiProperty()
  accessToken: string;
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
