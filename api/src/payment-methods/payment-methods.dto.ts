import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

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
