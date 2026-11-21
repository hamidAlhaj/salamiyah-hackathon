import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { CollectionPointType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { LookupsService } from './lookups.service';

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

/** Reference data: hospitals and collection points. Roles are checked in LookupsService. */
@ApiTags('lookups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class LookupsController {
  constructor(private readonly lookups: LookupsService) {}

  @Get('hospitals')
  @ApiOperation({ summary: 'المشافي المعتمدة (أي مستخدم مسجّل)' })
  hospitals() {
    return this.lookups.hospitals();
  }

  @Post('hospitals')
  @ApiOperation({ summary: 'إضافة مشفى (ADMIN)' })
  createHospital(@Body() dto: CreateHospitalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lookups.createHospital(dto, user);
  }

  @Get('collection-points')
  @ApiOperation({ summary: 'كل نقاط الجمع (ADMIN, FINANCE_VERIFIER, STAFF)' })
  collectionPoints(@CurrentUser() user: AuthenticatedUser) {
    return this.lookups.collectionPoints(user);
  }

  @Get('collection-points/mine')
  @ApiOperation({ summary: 'نقاط الجمع المرتبطة بي فقط (COLLECTOR)' })
  myCollectionPoints(@CurrentUser() user: AuthenticatedUser) {
    return this.lookups.myCollectionPoints(user);
  }

  @Post('collection-points')
  @ApiOperation({ summary: 'إضافة نقطة جمع (ADMIN)' })
  createCollectionPoint(
    @Body() dto: CreateCollectionPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lookups.createCollectionPoint(dto, user);
  }
}
