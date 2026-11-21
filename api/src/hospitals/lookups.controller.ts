import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { CollectionPointType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Authenticated, Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';

export class CreateHospitalDto {
  @ApiProperty({ example: 'المشفى الوطني بالسلمية' })
  @IsString()
  @Length(3, 120)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Salamiyah National Hospital' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ example: 'السلمية' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
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
  area: string;
}

/** بيانات مرجعية: المشافي ونقاط الجمع. */
@ApiTags('lookups')
@Controller()
export class LookupsController {
  constructor(private readonly prisma: PrismaService) {}

  @Authenticated()
  @Get('hospitals')
  @ApiOperation({ summary: 'المشافي المعتمدة' })
  hospitals() {
    return this.prisma.hospital.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
    });
  }

  @Roles('ADMIN')
  @Post('hospitals')
  @ApiOperation({ summary: 'إضافة مشفى' })
  createHospital(@Body() dto: CreateHospitalDto) {
    return this.prisma.hospital.create({ data: dto });
  }

  @Roles('ADMIN', 'FINANCE_VERIFIER', 'STAFF')
  @Get('collection-points')
  @ApiOperation({ summary: 'كل نقاط الجمع' })
  collectionPoints() {
    return this.prisma.collectionPoint.findMany({
      orderBy: { name: 'asc' },
      include: { collectors: { select: { id: true, fullName: true } } },
    });
  }

  @Roles('COLLECTOR')
  @Get('collection-points/mine')
  @ApiOperation({ summary: 'نقاط الجمع المرتبطة بي فقط' })
  myCollectionPoints(@CurrentUser() user: AuthUser) {
    return this.prisma.collectionPoint.findMany({
      where: { isActive: true, collectors: { some: { id: user.id } } },
      orderBy: { name: 'asc' },
    });
  }

  @Roles('ADMIN')
  @Post('collection-points')
  @ApiOperation({ summary: 'إضافة نقطة جمع' })
  createCollectionPoint(@Body() dto: CreateCollectionPointDto) {
    return this.prisma.collectionPoint.create({ data: dto });
  }
}
