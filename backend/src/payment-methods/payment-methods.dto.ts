import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

/** ADMIN: this campaign receives `method` payments on another (fake) account. */
export class SetCampaignAccountDto {
  @ApiProperty({ example: 'صندوق ترميم حي البعث (مثال)' })
  @IsString()
  @Length(2, 120)
  accountName: string;

  @ApiProperty({ example: '0930 000 099 (FAKE)' })
  @IsString()
  @Length(3, 60)
  accountNumber: string;

  @ApiPropertyOptional({ example: 'للتبرعات الخاصة بهذه الحملة فقط' })
  @IsOptional()
  @IsString()
  @Length(2, 300)
  note?: string;
}

export class PaymentLangQueryDto {
  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  lang: 'ar' | 'en' = 'ar';
}

/**
 * ADMIN edits a method's default receiving details (all fake for the hackathon). The behaviour flags
 * (receipt upload, demo checkout) and the kind are fixed by the seed and never edited here.
 * An empty string clears an optional text field.
 */
export class UpdatePaymentMethodConfigDto {
  @ApiPropertyOptional({ example: 'سيريتل كاش' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  labelAr?: string;

  @ApiPropertyOptional({ example: 'Syriatel Cash' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  labelEn?: string;

  @ApiPropertyOptional({ description: 'Arabic holder name' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  accountName?: string;

  @ApiPropertyOptional({ description: 'English holder name' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  accountNameEn?: string;

  @ApiPropertyOptional({ example: '0930 000 001 (FAKE)' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  instructionsAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  instructionsEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;
}
