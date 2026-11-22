import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayeeType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { AMOUNT_REGEX, NormalizeAmount } from '../common/dto/transforms';

/** multipart/form-data: the fields + a required `proof` file (invoice or photo, public-safe). */
export class CreateExpenditureDto {
  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ enum: PayeeType })
  @IsEnum(PayeeType)
  payeeType: PayeeType;

  @ApiProperty({
    example: 'مقاول ترميم (مثال)',
    description: 'Public-safe payee text; never a private person’s name',
  })
  @IsString()
  @Length(2, 120)
  payeeLabel: string;

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

  @ApiProperty({ type: 'string', format: 'binary', description: 'Invoice or photo (proof)' })
  proof?: unknown;
}
