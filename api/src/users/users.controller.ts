import { Body, ConflictException, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
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
import { hash } from 'bcrypt';
import { LIMITS, ROLES } from '../common/shared';
import type { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { NormalizePhone, PHONE_REGEX } from '../common/dto/transforms';
import type { AuthUser } from '../common/types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

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

const userSelect = {
  id: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  collectionPoints: { select: { id: true, name: true } },
} as const;

@ApiTags('users')
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'قائمة المستخدمين' })
  list() {
    return this.prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء موظف بأي دور' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser) {
    if (await this.prisma.user.findUnique({ where: { phone: dto.phone } }))
      throw new ConflictException('phone_taken');
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash: await hash(dto.password, 10),
        role: dto.role,
        collectionPoints: dto.collectionPointIds
          ? { connect: dto.collectionPointIds.map((id) => ({ id })) }
          : undefined,
      },
      select: userSelect,
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'user.create',
      entityType: 'User',
      entityId: user.id,
      after: { role: user.role },
    });
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'تعديل الدور/التفعيل/نقاط الجمع' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role,
        isActive: dto.isActive,
        collectionPoints: dto.collectionPointIds
          ? { set: dto.collectionPointIds.map((cp) => ({ id: cp })) }
          : undefined,
      },
      select: userSelect,
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'user.update',
      entityType: 'User',
      entityId: id,
      after: { role: user.role, isActive: user.isActive },
    });
    return user;
  }
}
