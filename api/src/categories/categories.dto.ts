import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { CATEGORY_ICONS, type CategoryIcon } from '../common/shared';

/**
 * ADMIN creates a category. Behaviour flags are not accepted: a new category is always a generic
 * campaign category (any payee type, no medical case, no monthly sponsorship).
 */
export class CreateCategoryDto {
  @ApiProperty({
    example: 'FOOD_BASKETS',
    description: 'Unique, immutable: upper-case letters, digits and _',
  })
  @Matches(/^[A-Z][A-Z0-9_]{2,39}$/, { message: 'invalid_category_code' })
  code: string;

  @ApiProperty({ example: 'سلال غذائية' })
  @IsString()
  @Length(2, 60)
  nameAr: string;

  @ApiProperty({ example: 'Food baskets' })
  @IsString()
  @Length(2, 60)
  nameEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 500)
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 500)
  descriptionEn?: string;

  @ApiProperty({ enum: CATEGORY_ICONS })
  @IsIn(CATEGORY_ICONS)
  icon: CategoryIcon;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

/** Names, descriptions, icon, order and active state. The code and the behaviour flags never change. */
export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 60)
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 60)
  nameEn?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  descriptionAr?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  descriptionEn?: string;

  @ApiPropertyOptional({ enum: CATEGORY_ICONS })
  @IsOptional()
  @IsIn(CATEGORY_ICONS)
  icon?: CategoryIcon;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Activate or deactivate (system categories too)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoriesLangQueryDto {
  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  lang: 'ar' | 'en' = 'ar';
}
