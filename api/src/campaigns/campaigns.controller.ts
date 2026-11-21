import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import {
  CreateCampaignUpdateDto,
  CreateOngoingCampaignDto,
  LangQueryDto,
  ListCampaignsQueryDto,
  UpdateCampaignStatusDto,
} from './campaigns.dto';
import { CampaignsService } from './campaigns.service';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'الحملات الطبية العامة (المتحقق + بانتظار التحقق)' })
  list(@Query() query: ListCampaignsQueryDto) {
    return this.campaigns.listPublic(query);
  }

  @Roles('ADMIN', 'CASE_OFFICER', 'FINANCE_VERIFIER', 'STAFF', 'COLLECTOR')
  @Get('staff/all')
  @ApiOperation({ summary: 'كل الحملات للوحات الموظفين' })
  listForStaff() {
    return this.campaigns.listForStaff();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'تفاصيل حملة عامة (بلا بيانات شخصية)' })
  @ApiNotFoundResponse({ description: 'campaign_not_found' })
  get(@Param('slug') slug: string, @Query() query: LangQueryDto) {
    return this.campaigns.getPublic(slug, query.lang);
  }

  @Public()
  @Get(':id/transparency')
  @ApiOperation({ summary: 'الشفافية: المتحقق/بانتظار التحقق/المصروف (FR-23)' })
  transparency(@Param('id') id: string) {
    return this.campaigns.transparency(id);
  }

  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'حملة مستمرة بلا حالة فردية (مثل مرضى السرطان)' })
  createOngoing(@Body() dto: CreateOngoingCampaignDto, @CurrentUser() user: AuthUser) {
    return this.campaigns.createOngoing(dto, user.id);
  }

  @Roles('ADMIN', 'CASE_OFFICER')
  @Patch(':id/status')
  @ApiOperation({ summary: 'تغيير حالة الحملة / إيقاف التعهدات' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.campaigns.updateStatus(id, dto, user.id);
  }

  @Roles('STAFF', 'CASE_OFFICER', 'ADMIN')
  @Post(':id/updates')
  @ApiOperation({ summary: 'نشر تحديث للحملة («تمت العملية»)' })
  addUpdate(
    @Param('id') id: string,
    @Body() dto: CreateCampaignUpdateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.campaigns.addUpdate(id, dto, user.id);
  }
}
