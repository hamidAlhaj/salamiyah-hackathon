import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { LIMITS } from '../common/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
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

@ApiTags('imports')
@Roles('STAFF', 'ADMIN')
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
    @CurrentUser() user: AuthUser,
  ) {
    return this.imports.preview(file, user);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: '2) تطبيق المطابقة ← dry run (صالح/أخطاء/تكرار)' })
  validate(@Param('id') id: string, @Body() mapping: MappingDto) {
    return this.imports.validate(id, { ...mapping });
  }

  @Post(':id/commit')
  @ApiOperation({ summary: '3) الحفظ في transaction (التكرارات تُتخطى)' })
  commit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.imports.commit(id, user);
  }

  @Get(':id/errors.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="import-errors.csv"')
  @ApiOperation({ summary: 'الصفوف المرفوضة مع السبب' })
  errors(@Param('id') id: string) {
    return this.imports.errorsCsv(id);
  }
}
