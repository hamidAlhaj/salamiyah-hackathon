import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { LIMITS } from '../common/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ImportsService } from './imports.service';

class ImportFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ملف .xlsx أو .csv (≤ 10MB، ≤ 5000 صف)',
  })
  file?: unknown;
}

/** مطابقة حقول النظام مع أسماء أعمدة الملف. */
class MappingDto {
  @ApiProperty({ example: 'الاسم الكامل' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: 'الموبايل' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'الرقم الوطني' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ example: 'المجلس' })
  @IsOptional()
  @IsString()
  localCouncil?: string;

  @ApiPropertyOptional({ example: 'البرامج' })
  @IsOptional()
  @IsString()
  otherPrograms?: string;
}

/** Beneficiary import (STAFF, ADMIN). Roles are checked in ImportsService. */
@ApiTags('imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: LIMITS.maxImportBytes } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ImportFileDto })
  @ApiOperation({ summary: '1) رفع الملف ← العناوين + أول 20 صف + mapping مقترح' })
  preview(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.imports.preview(file, user);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: '2) تطبيق المطابقة ← dry run (صالح/أخطاء/تكرار)' })
  validate(
    @Param('id') id: string,
    @Body() mapping: MappingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.imports.validate(id, { ...mapping }, user);
  }

  @Post(':id/commit')
  @ApiOperation({ summary: '3) الحفظ في transaction (التكرارات تُتخطى)' })
  commit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.imports.commit(id, user);
  }

  @Get(':id/errors.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="import-errors.csv"')
  @ApiOperation({ summary: 'الصفوف المرفوضة مع السبب' })
  errors(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.imports.errorsCsv(id, user);
  }
}
