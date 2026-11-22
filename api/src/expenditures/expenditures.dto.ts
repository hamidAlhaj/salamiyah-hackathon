import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayeeType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { AMOUNT_REGEX, NormalizeAmount, ToBoolean } from '../common/dto/transforms';

/** multipart/form-data: the fields + a required `proof` file (invoice or photo). */
export class CreateExpenditureDto {
  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ enum: PayeeType })
  @IsEnum(PayeeType)
  payeeType: PayeeType;

  @ApiPropertyOptional({
    example: 'مقاول ترميم (مثال)',
    description:
      'Public-safe payee text, never a private person’s name. Ignored for a locked hospital (its approved name is used).',
  })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  payeeLabel?: string;

  @ApiPropertyOptional({
    description: 'For BENEFICIARY_FAMILY: a beneficiary linked to the campaign',
  })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiProperty({ example: '15000000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiProperty({ example: '2026-11-20' })
  @IsDateString()
  paidAt: string;

  @ApiProperty({ example: 'دفعة أولى لأعمال الترميم' })
  @IsString()
  @Length(2, 1000)
  description: string;

  @ApiPropertyOptional({ example: 'First payment for the renovation works' })
  @IsOptional()
  @IsString()
  @Length(2, 1000)
  descriptionEn?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Reviewed as safe to publish: the proof is shown on the public timeline',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  proofPublic?: boolean;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Invoice or photo (proof)' })
  proof?: unknown;
}

/** multipart/form-data: the month to pay + an optional shared `proof` (e.g. the transfer slip). */
export class MonthlyRunDto {
  @ApiProperty({ example: '2026-11', description: 'The sponsorship month (YYYY-MM)' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'invalid_period_month' })
  periodMonth: string;

  @ApiPropertyOptional({ example: '2026-11-25' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  proofPublic?: boolean;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  proof?: unknown;
}
