import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeneficiaryKind } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
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

/** ADMIN corrects a beneficiary's record. The public code never changes. */
export class UpdateBeneficiaryDto {
  @ApiPropertyOptional({ enum: BeneficiaryKind })
  @IsOptional()
  @IsEnum(BeneficiaryKind)
  kind?: BeneficiaryKind;

  @ApiPropertyOptional({ description: 'Private: never shown publicly' })
  @IsOptional()
  @IsString()
  @Length(3, 120)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Private' })
  @IsOptional()
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Public: a neighbourhood at most; an empty string clears it',
  })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  area?: string;
}

/** ADMIN changes a campaign link: the monthly amount (sponsorship categories) or ends the link. */
export class UpdateBeneficiaryLinkDto {
  @ApiPropertyOptional({ example: '200000' })
  @IsOptional()
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  monthlyAmount?: string;

  @ApiPropertyOptional({
    description: 'true ends the link (kept in history, no longer public)',
  })
  @IsOptional()
  @IsBoolean()
  end?: boolean;
}

/** ADMIN suspends or reactivates a beneficiary: the reason is required and kept in the notes log. */
export class BeneficiaryReasonDto {
  @ApiProperty({
    example: 'Registered twice under two campaigns; review with the welfare board.',
    description: 'Internal reason (ADMIN only, never public, never shown at intake)',
  })
  @IsString()
  @Length(5, 1000)
  reason: string;
}

/** Kinds an ADMIN may write by hand; SUSPENDED / REACTIVATED come only from the suspend endpoints. */
export const MANUAL_NOTE_KINDS = ['NOTE', 'VIOLATION'] as const;

/** ADMIN adds an entry to a beneficiary's internal log (a note or a recorded violation). */
export class CreateBeneficiaryNoteDto {
  @ApiProperty({ enum: MANUAL_NOTE_KINDS })
  @IsIn(MANUAL_NOTE_KINDS)
  kind: (typeof MANUAL_NOTE_KINDS)[number];

  @ApiProperty({ example: 'Asked for the same help at two offices in one month.' })
  @IsString()
  @Length(5, 1000)
  body: string;
}
