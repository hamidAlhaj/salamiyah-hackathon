import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  CAMPAIGN_STATUSES,
  COVER_KEYS,
  CURRENCIES,
  PRIORITIES,
  type CoverKey,
} from '../common/shared';
import type { CampaignStatus, Currency, Priority } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AMOUNT_REGEX, NormalizeAmount } from '../common/dto/transforms';

/** Statuses a public list may filter by. */
const PUBLIC_CAMPAIGN_STATUSES = ['ACTIVE', 'FUNDED', 'COMPLETED'] as const;

export class ListCampaignsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'ORPHAN_SPONSORSHIP',
    description: 'Category code (display filter)',
  })
  @IsOptional()
  @Matches(/^[A-Z][A-Z0-9_]{2,39}$/, { message: 'invalid_category_code' })
  category?: string;

  @ApiPropertyOptional({ enum: PUBLIC_CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(PUBLIC_CAMPAIGN_STATUSES)
  status?: (typeof PUBLIC_CAMPAIGN_STATUSES)[number];

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

/** ADMIN creates a campaign in an active category without requiresMedicalCase. */
export class CreateCampaignDto {
  @ApiProperty({
    description: 'CampaignCategory id (an active category without requiresMedicalCase)',
  })
  @IsUUID()
  categoryId: string;

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

  @ApiPropertyOptional({
    enum: COVER_KEYS,
    description: 'Bundled illustration (never a photo)',
  })
  @IsOptional()
  @IsIn(COVER_KEYS)
  coverKey?: CoverKey;

  @ApiPropertyOptional({ example: 'حي الشيخ بدر', description: 'A neighbourhood at most' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  area?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Open-ended programme (e.g. yearly sponsorship)',
  })
  @IsOptional()
  @IsBoolean()
  isOngoing?: boolean;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'DRAFT'],
    default: 'ACTIVE',
    description: 'ACTIVE publishes now',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'DRAFT'])
  status?: 'ACTIVE' | 'DRAFT';
}

/** A status change, a pause/resume of new pledges, or both (at least one is required). */
export class UpdateCampaignStatusDto {
  @ApiPropertyOptional({ enum: CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(CAMPAIGN_STATUSES)
  status?: CampaignStatus;

  @ApiPropertyOptional({ description: 'إيقاف/استئناف قبول التعهدات' })
  @IsOptional()
  @IsBoolean()
  acceptsPledges?: boolean;
}

/**
 * Edits the public presentation of a campaign. Money, category, hospital and status never change
 * here. An empty string clears an optional English text or the area.
 */
export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 160)
  titleAr?: string;

  @ApiPropertyOptional({ description: 'An empty string clears it' })
  @IsOptional()
  @IsString()
  @Length(0, 160)
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Anonymised summary (no names)' })
  @IsOptional()
  @IsString()
  @Length(10, 4000)
  summaryAr?: string;

  @ApiPropertyOptional({ description: 'An empty string clears it' })
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  summaryEn?: string;

  @ApiPropertyOptional({
    enum: COVER_KEYS,
    description: 'Bundled illustration (never a photo)',
  })
  @IsOptional()
  @IsIn(COVER_KEYS)
  coverKey?: CoverKey;

  @ApiPropertyOptional({ description: 'A neighbourhood at most; an empty string clears it' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  area?: string;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: Priority;
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
