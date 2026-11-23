import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionPointType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreateHospitalDto {
  @ApiProperty({ example: 'المشفى الوطني بالسلمية' })
  @IsString()
  @Length(3, 120)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Salamiyah National Hospital' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nameEn?: string;

  @ApiProperty({ example: 'السلمية' })
  @IsString()
  @Length(2, 60)
  city: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

/** ADMIN edits a hospital; deactivating hides it from new cases (existing cases keep it). */
export class UpdateHospitalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 120)
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 60)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCollectionPointDto {
  @ApiProperty({ example: 'نقطة جمع الحي الشمالي' })
  @IsString()
  @Length(3, 120)
  name: string;

  @ApiPropertyOptional({ enum: CollectionPointType, default: CollectionPointType.OTHER })
  @IsOptional()
  @IsEnum(CollectionPointType)
  type?: CollectionPointType;

  @ApiPropertyOptional({ description: 'Contact person at the collection point (optional)' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  contactName?: string;

  @ApiProperty({ example: 'الحي الشمالي' })
  @IsString()
  @Length(2, 60)
  area: string;
}

/** ADMIN edits a collection point; a deactivated point is no longer offered to donors. */
export class UpdateCollectionPointDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 120)
  name?: string;

  @ApiPropertyOptional({ enum: CollectionPointType })
  @IsOptional()
  @IsEnum(CollectionPointType)
  type?: CollectionPointType;

  @ApiPropertyOptional({ description: 'Contact person; an empty string clears it' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 60)
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
