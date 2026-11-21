import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { LIMITS, ROLES } from '../common/shared';
import type { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { NormalizePhone, PHONE_REGEX } from '../common/dto/transforms';
import { UsersService } from './users.service';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @Length(3, 120)
  fullName: string;

  @ApiProperty({ example: '0944000111' })
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  phone: string;

  @ApiProperty()
  @IsString()
  @MinLength(LIMITS.passwordMinLength)
  password: string;

  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role: Role;

  @ApiPropertyOptional({ description: 'للـCOLLECTOR: نقاط الجمع المرتبطة' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collectionPointIds?: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collectionPointIds?: string[];
}

/** Staff account administration (ADMIN). Roles are checked in UsersService. */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة المستخدمين' })
  list(@CurrentUser() actor: AuthenticatedUser) {
    return this.users.list(actor);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء موظف بأي دور' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.users.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تعديل الدور/التفعيل/نقاط الجمع' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.users.update(id, dto, actor);
  }
}
