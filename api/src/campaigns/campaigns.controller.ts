import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateCampaignUpdateDto,
  CreateOngoingCampaignDto,
  LangQueryDto,
  ListCampaignsQueryDto,
  UpdateCampaignStatusDto,
} from './campaigns.dto';
import { CampaignsService } from './campaigns.service';

/** Public campaign pages (no personal data). */
@ApiTags('campaigns')
@Controller('campaigns')
export class PublicCampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'الحملات الطبية العامة (المتحقق + بانتظار التحقق)' })
  list(@Query() query: ListCampaignsQueryDto) {
    return this.campaigns.listPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'تفاصيل حملة عامة (بلا بيانات شخصية)' })
  @ApiNotFoundResponse({ description: 'campaign_not_found' })
  get(@Param('slug') slug: string, @Query() query: LangQueryDto) {
    return this.campaigns.getPublic(slug, query.lang);
  }

  @Get(':id/transparency')
  @ApiOperation({ summary: 'الشفافية: المتحقق/بانتظار التحقق/المصروف (FR-23)' })
  transparency(@Param('id') id: string) {
    return this.campaigns.transparency(id);
  }
}

/** Staff campaign management. Roles are checked in CampaignsService. */
@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get('staff/all')
  @ApiOperation({ summary: 'كل الحملات للوحات الموظفين (كل الأدوار عدا DONOR)' })
  listForStaff(@CurrentUser() user: AuthenticatedUser) {
    return this.campaigns.listForStaff(user);
  }

  @Post()
  @ApiOperation({ summary: 'حملة مستمرة بلا حالة فردية (ADMIN)' })
  createOngoing(
    @Body() dto: CreateOngoingCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaigns.createOngoing(dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغيير حالة الحملة / إيقاف التعهدات (ADMIN, CASE_OFFICER)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaigns.updateStatus(id, dto, user);
  }

  @Post(':id/updates')
  @ApiOperation({ summary: 'نشر تحديث للحملة (STAFF, CASE_OFFICER, ADMIN)' })
  addUpdate(
    @Param('id') id: string,
    @Body() dto: CreateCampaignUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaigns.addUpdate(id, dto, user);
  }
}
