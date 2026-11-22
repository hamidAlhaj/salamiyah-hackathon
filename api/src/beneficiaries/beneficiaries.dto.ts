import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeneficiaryKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import {
  AMOUNT_REGEX,
  NormalizeAmount,
  NormalizePhone,
  PHONE_REGEX,
} from '../common/dto/transforms';

/** Staff register an anonymised beneficiary. The name and phone stay private; the public sees the code. */
export class CreateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryKind })
  @IsEnum(BeneficiaryKind)
  kind: BeneficiaryKind;

  @ApiProperty({ example: 'أحمد م.', description: 'Private: never shown publicly' })
  @IsString()
  @Length(3, 120)
  fullName: string;

  @ApiPropertyOptional({ example: '0944123456', description: 'Private' })
  @IsOptional()
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  phone?: string;

  @ApiPropertyOptional({
    example: 'حي الشيخ بدر',
    description: 'Public: a neighbourhood at most',
  })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  area?: string;
}

export class LinkBeneficiaryDto {
  @ApiProperty()
  @IsUUID()
  beneficiaryId: string;

  @ApiPropertyOptional({
    example: '200000',
    description: 'Monthly amount; only for categories that support monthly sponsorship',
  })
  @IsOptional()
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  monthlyAmount?: string;
}

export class ListBeneficiariesQueryDto {
  @ApiPropertyOptional({ description: 'Code (B-XXXX), name or area' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  q?: string;
}
