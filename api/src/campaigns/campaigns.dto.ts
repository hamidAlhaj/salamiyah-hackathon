import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { CAMPAIGN_STATUSES, CURRENCIES, PRIORITIES } from '../common/shared';
import type { CampaignStatus, Currency, Priority } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AMOUNT_REGEX, NormalizeAmount } from '../common/dto/transforms';

export class ListCampaignsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: Priority;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  lang: 'ar' | 'en' = 'ar';
}

export class LangQueryDto {
  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  lang: 'ar' | 'en' = 'ar';
}

/** حملة مستمرة بلا حالة فردية (مثل برنامج مرضى السرطان). */
export class CreateOngoingCampaignDto {
  @ApiProperty({ example: 'دعم جرعات ونقل مرضى السرطان' })
  @IsString()
  @Length(5, 160)
  titleAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 160)
  titleEn?: string;

  @ApiProperty()
  @IsString()
  @Length(10, 4000)
  summaryAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(10, 4000)
  summaryEn?: string;

  @ApiProperty({ example: '50000000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  targetAmount: string;

  @ApiProperty({ enum: CURRENCIES, default: 'SYP' })
  @IsIn(CURRENCIES)
  currency: Currency = 'SYP';

  @ApiProperty({ enum: PRIORITIES, default: 'NORMAL' })
  @IsIn(PRIORITIES)
  priority: Priority = 'NORMAL';
}

export class UpdateCampaignStatusDto {
  @ApiProperty({ enum: CAMPAIGN_STATUSES })
  @IsIn(CAMPAIGN_STATUSES)
  status: CampaignStatus;

  @ApiPropertyOptional({ description: 'إيقاف/استئناف قبول التعهدات' })
  @IsOptional()
  @IsBoolean()
  acceptsPledges?: boolean;
}

export class CreateCampaignUpdateDto {
  @ApiProperty({ example: 'تمت العملية بنجاح، شكراً لكل المتبرعين.' })
  @IsString()
  @Length(5, 2000)
  bodyAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 2000)
  bodyEn?: string;
}
