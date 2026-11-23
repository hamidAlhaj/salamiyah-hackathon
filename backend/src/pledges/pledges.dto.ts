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
  DEMO_PAYMENT_METHODS,
  RECEIPT_PAYMENT_METHODS,
  SURPLUS_CHOICES,
} from '../common/shared';
import type { SurplusChoice } from '../common/shared';
import type { PaymentMethod } from '@prisma/client';
import {
  AMOUNT_REGEX,
  NormalizeAmount,
  NormalizePhone,
  PHONE_REGEX,
} from '../common/dto/transforms';

export class CreatePledgeDto {
  @ApiProperty()
  @IsString()
  campaignId: string;

  @ApiProperty({ example: '500000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiProperty({ enum: RECEIPT_PAYMENT_METHODS, default: 'BEMO_TRANSFER' })
  @IsIn(RECEIPT_PAYMENT_METHODS)
  method: PaymentMethod;

  @ApiPropertyOptional({
    default: false,
    description: 'العرض العام كـ«فاعل خير»؛ الإيصال الرسمي يبقى باسمه',
  })
  @IsOptional()
  @IsBoolean()
  isAnonymousDisplay?: boolean;
  @ApiPropertyOptional({
    enum: SURPLUS_CHOICES,
    description:
      'Only when the amount exceeds the remaining need: SPLIT = the surplus goes to the general council fund, REMAINING_ONLY = pledge only the remaining need',
  })
  @IsOptional()
  @IsIn(SURPLUS_CHOICES)
  surplusChoice?: SurplusChoice;

  @ApiPropertyOptional({
    example: '30000',
    description:
      'The campaign share the donor saw in the preview; a different server value → 409 allocation_changed',
  })
  @IsOptional()
  @Matches(/^\d{1,12}(\.\d{1,2})?$/, { message: 'invalid_amount' })
  expectedCampaignShare?: string;
}

export class DemoPledgeDto {
  @ApiProperty()
  @IsString()
  campaignId: string;

  @ApiProperty({ example: '100000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiProperty({ enum: DEMO_PAYMENT_METHODS })
  @IsIn(DEMO_PAYMENT_METHODS)
  method: PaymentMethod;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymousDisplay?: boolean;
  @ApiPropertyOptional({
    enum: SURPLUS_CHOICES,
    description:
      'Only when the amount exceeds the remaining need: SPLIT = the surplus goes to the general council fund, REMAINING_ONLY = pledge only the remaining need',
  })
  @IsOptional()
  @IsIn(SURPLUS_CHOICES)
  surplusChoice?: SurplusChoice;

  @ApiPropertyOptional({
    example: '30000',
    description:
      'The campaign share the donor saw in the preview; a different server value → 409 allocation_changed',
  })
  @IsOptional()
  @Matches(/^\d{1,12}(\.\d{1,2})?$/, { message: 'invalid_amount' })
  expectedCampaignShare?: string;
}

/**
 * A donor promises cash and hands it over at an active collection point. The collector confirms
 * receipt later (P12) and finance verifies; until then the pledge is only PLEDGED.
 */
export class CashPledgeDto {
  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ example: '250000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiProperty({ description: 'An active collection point (GET /collection-points/active)' })
  @IsUUID()
  collectionPointId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymousDisplay?: boolean;
  @ApiPropertyOptional({
    enum: SURPLUS_CHOICES,
    description:
      'Only when the amount exceeds the remaining need: SPLIT = the surplus goes to the general council fund, REMAINING_ONLY = pledge only the remaining need',
  })
  @IsOptional()
  @IsIn(SURPLUS_CHOICES)
  surplusChoice?: SurplusChoice;

  @ApiPropertyOptional({
    example: '30000',
    description:
      'The campaign share the donor saw in the preview; a different server value → 409 allocation_changed',
  })
  @IsOptional()
  @Matches(/^\d{1,12}(\.\d{1,2})?$/, { message: 'invalid_amount' })
  expectedCampaignShare?: string;
}

/** FR-18: تبرع حضوري في المجلس — الاسم والهاتف إلزاميان (إيصال باسمه). */
export class CouncilPledgeDto {
  @ApiProperty()
  @IsString()
  campaignId: string;

  @ApiProperty({ example: '1000000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiProperty({ example: 'سليم ح.' })
  @IsString()
  @Length(3, 120)
  donorName: string;

  @ApiProperty({ example: '0955123456' })
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  donorPhone: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymousDisplay?: boolean;
}

/** FR-19: حصيلة نقطة جمع — الاسم والهاتف اختياريان. */
export class CollectorPledgeDto {
  @ApiProperty()
  @IsString()
  campaignId: string;

  @ApiProperty()
  @IsString()
  collectionPointId: string;

  @ApiProperty({ example: '2350000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 120)
  donorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  donorPhone?: string;
}

/** multipart/form-data: ملف `receipt` + رقم مرجع التحويل اختياري. */
export class UploadReceiptDto {
  @ApiPropertyOptional({ example: 'TRX-559201', description: 'رقم مرجع التحويل من البنك' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  transferRef?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'صورة/PDF الإيصال (≤ 5MB)' })
  receipt?: unknown;
}

/** GET /campaigns/:id/allocation: the amount the donor is about to give. */
export class AllocationQueryDto {
  @ApiProperty({ example: '50000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  amount: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  lang: 'ar' | 'en' = 'ar';
}

/** POST /pledges/:id/allocation-decision: what to do with money held because the campaign was full. */
export class AllocationDecisionDto {
  @ApiProperty({
    enum: ['FUND'],
    description: 'FUND = give the held amount to the general council fund',
  })
  @IsIn(['FUND'])
  decision: 'FUND';
}
