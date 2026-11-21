import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LIMITS } from '../common/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import { CreateDisbursementDto } from './disbursements.dto';
import { DisbursementsService } from './disbursements.service';

@ApiTags('disbursements')
@Controller()
export class DisbursementsController {
  constructor(private readonly disbursements: DisbursementsService) {}

  @Roles('FINANCE_VERIFIER')
  @Post('disbursements')
  @UseInterceptors(FileInterceptor('invoice', { limits: { fileSize: LIMITS.maxUploadBytes } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateDisbursementDto })
  @ApiOperation({ summary: 'صرف للمشفى المعتمد مع الفاتورة (FR-21)' })
  create(
    @Body() dto: CreateDisbursementDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.disbursements.create(dto, file, user);
  }

  @Roles('FINANCE_VERIFIER', 'ADMIN', 'CASE_OFFICER')
  @Get('campaigns/:id/disbursements')
  @ApiOperation({ summary: 'سجل الصرف لحملة' })
  list(@Param('id') id: string) {
    return this.disbursements.listForCampaign(id);
  }
}
