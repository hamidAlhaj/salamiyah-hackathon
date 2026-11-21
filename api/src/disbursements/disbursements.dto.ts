import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length, Matches } from 'class-validator';
import { AMOUNT_REGEX, NormalizeAmount } from '../common/dto/transforms';

/** multipart/form-data: الحقول + ملف `invoice` (فاتورة المشفى، إلزامي). */
export class CreateDisbursementDto {
  @ApiProperty()
  @IsString()
  campaignId: string;

  @ApiProperty({ example: '15000000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiProperty({ example: '2026-11-20' })
  @IsDateString()
  paidAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 500)
  note?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'فاتورة المشفى' })
  invoice?: unknown;
}
