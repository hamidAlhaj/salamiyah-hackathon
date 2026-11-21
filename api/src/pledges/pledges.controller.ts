import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LIMITS } from '../common/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Authenticated, Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import {
  CollectorPledgeDto,
  CouncilPledgeDto,
  CreatePledgeDto,
  DemoPledgeDto,
  UploadReceiptDto,
} from './pledges.dto';
import { PledgesService } from './pledges.service';

@ApiTags('pledges')
@Controller()
export class PledgesController {
  constructor(private readonly pledges: PledgesService) {}

  @Roles('DONOR')
  @Post('pledges')
  @ApiOperation({ summary: 'تعهد من المنصة ← تعليمات التحويل (FR-13)' })
  create(@Body() dto: CreatePledgeDto, @CurrentUser() user: AuthUser) {
    return this.pledges.create(dto, user);
  }

  @Roles('DONOR')
  @Post('pledges/demo')
  @ApiOperation({ summary: 'محاكاة دفع فوري — وضع العرض فقط (FR-20)' })
  createDemo(@Body() dto: DemoPledgeDto, @CurrentUser() user: AuthUser) {
    return this.pledges.createDemo(dto, user);
  }

  @Roles('STAFF', 'FINANCE_VERIFIER')
  @Post('pledges/council')
  @ApiOperation({ summary: 'تبرع حضوري في المجلس (FR-18)' })
  createCouncil(@Body() dto: CouncilPledgeDto, @CurrentUser() user: AuthUser) {
    return this.pledges.createCouncil(dto, user);
  }

  @Roles('COLLECTOR')
  @Post('pledges/collector')
  @ApiOperation({ summary: 'تسجيل حصيلة نقطة جمع (FR-19)' })
  createCollector(@Body() dto: CollectorPledgeDto, @CurrentUser() user: AuthUser) {
    return this.pledges.createCollector(dto, user);
  }

  @Roles('DONOR')
  @Get('pledges/mine')
  @ApiOperation({ summary: '«تبرعاتي» (FR-17)' })
  mine(@CurrentUser() user: AuthUser) {
    return this.pledges.mine(user);
  }

  @Roles('STAFF', 'COLLECTOR', 'FINANCE_VERIFIER')
  @Get('pledges/recorded')
  @ApiOperation({ summary: 'ما سجّلته بنفسي (حضوري/نقطة جمع)' })
  recorded(@CurrentUser() user: AuthUser) {
    return this.pledges.recordedByMe(user);
  }

  @Authenticated()
  @Get('pledges/:id')
  @ApiOperation({ summary: 'تفاصيل تعهد (المالك أو المالية)' })
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pledges.get(id, user);
  }

  @Roles('DONOR', 'STAFF')
  @Post('pledges/:id/receipts')
  @UseInterceptors(FileInterceptor('receipt', { limits: { fileSize: LIMITS.maxUploadBytes } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadReceiptDto })
  @ApiOperation({ summary: 'رفع إيصال التحويل ← قيد التحقق (FR-14)' })
  uploadReceipt(
    @Param('id') id: string,
    @Body() dto: UploadReceiptDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pledges.uploadReceipt(id, file, dto.transferRef, user);
  }

  @Roles('DONOR')
  @Post('pledges/:id/cancel')
  @ApiOperation({ summary: 'إلغاء تعهد قبل التحقق' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pledges.cancel(id, user);
  }

  @Authenticated()
  @Get('receipts/:id/file')
  @ApiOperation({ summary: 'صورة الإيصال المرفوع (المالك أو المالية)' })
  async receiptFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<StreamableFile> {
    const file = await this.pledges.receiptFile(id, user);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }

  @Public()
  @Get('official-receipts/:no')
  @ApiOperation({ summary: 'الإيصال الرسمي برقمه (FR-16)' })
  officialReceipt(@Param('no') no: string) {
    return this.pledges.officialReceipt(no);
  }
}
