import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Role } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { NormalizePhone, PHONE_REGEX } from '../common/dto/transforms';
import { LIMITS, ROLES } from '../common/shared';

/** ADMIN creates an account with any role (staff, collector or donor). */
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

  @ApiPropertyOptional({ description: 'COLLECTOR only: the collection points they serve' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  collectionPointIds?: string[];
}

/** ADMIN changes the name, role, active flag or (collectors) the assigned collection points. */
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 120)
  fullName?: string;

  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'COLLECTOR only: replaces the assigned collection points',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  collectionPointIds?: string[];
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: Role;
}
