import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LIMITS } from '../common/shared';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDisbursementDto } from './disbursements.dto';
import { DisbursementsService } from './disbursements.service';

@ApiTags('disbursements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DisbursementsController {
  constructor(private readonly disbursements: DisbursementsService) {}

  @Post('disbursements')
  @UseInterceptors(FileInterceptor('invoice', { limits: { fileSize: LIMITS.maxUploadBytes } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateDisbursementDto })
  @ApiOperation({ summary: 'صرف للمشفى المعتمد مع الفاتورة (FINANCE_VERIFIER, FR-21)' })
  create(
    @Body() dto: CreateDisbursementDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.disbursements.create(dto, file, user);
  }

  @Get('campaigns/:id/disbursements')
  @ApiOperation({ summary: 'سجل الصرف لحملة (FINANCE_VERIFIER, ADMIN, CASE_OFFICER)' })
  list(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disbursements.listForCampaign(id, user);
  }
}
