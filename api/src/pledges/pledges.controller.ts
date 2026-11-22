import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LIMITS } from '../common/shared';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { LangQueryDto } from '../campaigns/campaigns.dto';
import {
  CashPledgeDto,
  CollectorPledgeDto,
  CouncilPledgeDto,
  CreatePledgeDto,
  DemoPledgeDto,
  UploadReceiptDto,
} from './pledges.dto';
import { PledgesService } from './pledges.service';

/** Public official-receipt lookup by receipt number (FR-16). */
@ApiTags('pledges')
@Controller()
export class OfficialReceiptsController {
  constructor(private readonly pledges: PledgesService) {}

  @Get('official-receipts/:no')
  @ApiOperation({ summary: 'الإيصال الرسمي برقمه (FR-16)' })
  officialReceipt(@Param('no') no: string) {
    return this.pledges.officialReceipt(no);
  }
}

/** Pledges and receipts. Roles and ownership are checked in PledgesService. */
@ApiTags('pledges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PledgesController {
  constructor(private readonly pledges: PledgesService) {}

  @Post('pledges')
  @ApiOperation({ summary: 'تعهد من المنصة ← تعليمات التحويل (DONOR, FR-13)' })
  create(@Body() dto: CreatePledgeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pledges.create(dto, user);
  }

  @Post('pledges/demo')
  @ApiOperation({ summary: 'محاكاة دفع فوري — وضع العرض فقط (DONOR, FR-20)' })
  createDemo(@Body() dto: DemoPledgeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pledges.createDemo(dto, user);
  }

  @Post('pledges/cash')
  @ApiOperation({
    summary: 'Cash at an active collection point: a reference to show the collector (DONOR)',
  })
  createCash(@Body() dto: CashPledgeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pledges.createCash(dto, user);
  }

  @Post('pledges/council')
  @ApiOperation({ summary: 'تبرع حضوري في المجلس (STAFF, FINANCE_VERIFIER, FR-18)' })
  createCouncil(@Body() dto: CouncilPledgeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pledges.createCouncil(dto, user);
  }

  @Post('pledges/collector')
  @ApiOperation({ summary: 'تسجيل حصيلة نقطة جمع (COLLECTOR, FR-19)' })
  createCollector(@Body() dto: CollectorPledgeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pledges.createCollector(dto, user);
  }

  @Get('pledges/mine')
  @ApiOperation({ summary: '«تبرعاتي» (DONOR, FR-17)' })
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.pledges.mine(user);
  }

  @Get('pledges/recorded')
  @ApiOperation({ summary: 'ما سجّلته بنفسي (STAFF, COLLECTOR, FINANCE_VERIFIER)' })
  recorded(@CurrentUser() user: AuthenticatedUser) {
    return this.pledges.recordedByMe(user);
  }

  @Get('pledges/:id')
  @ApiOperation({ summary: 'تفاصيل تعهد (المالك أو المالية)' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LangQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pledges.get(id, user, query.lang);
  }

  @Post('pledges/:id/receipts')
  @UseInterceptors(FileInterceptor('receipt', { limits: { fileSize: LIMITS.maxUploadBytes } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadReceiptDto })
  @ApiOperation({ summary: 'رفع إيصال التحويل ← قيد التحقق (DONOR, STAFF, FR-14)' })
  uploadReceipt(
    @Param('id') id: string,
    @Body() dto: UploadReceiptDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pledges.uploadReceipt(id, file, dto.transferRef, user);
  }

  @Post('pledges/:id/cancel')
  @ApiOperation({ summary: 'إلغاء تعهد قبل التحقق (DONOR)' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.pledges.cancel(id, user);
  }

  @Get('receipts/:id/file')
  @ApiOperation({ summary: 'صورة الإيصال المرفوع (المالك أو المالية)' })
  async receiptFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const file = await this.pledges.receiptFile(id, user);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }
}
