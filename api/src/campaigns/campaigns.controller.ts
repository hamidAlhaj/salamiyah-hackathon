import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateCampaignDto,
  CreateCampaignUpdateDto,
  LangQueryDto,
  ListCampaignsQueryDto,
  UpdateCampaignDto,
  UpdateCampaignStatusDto,
} from './campaigns.dto';
import { CampaignsService } from './campaigns.service';

/** Public campaign pages (no personal data). */
@ApiTags('campaigns')
@Controller('campaigns')
export class PublicCampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  @ApiOperation({
    summary: 'Public campaigns of every category (filter by category code/status)',
  })
  list(@Query() query: ListCampaignsQueryDto) {
    return this.campaigns.listPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'تفاصيل حملة عامة (بلا بيانات شخصية)' })
  @ApiNotFoundResponse({ description: 'campaign_not_found' })
  get(@Param('slug') slug: string, @Query() query: LangQueryDto) {
    return this.campaigns.getPublic(slug, query.lang);
  }

  @Get(':id/ledger')
  @ApiOperation({
    summary: 'Campaign account: verified, pending, demo, spent, remaining = verified − spent',
  })
  @ApiNotFoundResponse({ description: 'campaign_not_found' })
  ledger(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.ledger(id);
  }

  @Get(':id/transparency')
  @ApiOperation({ summary: 'Ledger + public-safe spending list (FR-23)' })
  transparency(@Param('id', ParseUUIDPipe) id: string) {
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
  @ApiOperation({
    summary:
      'Create a campaign in a category (ADMIN; medical-case categories come from the case pipeline)',
  })
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: AuthenticatedUser) {
    return this.campaigns.create(dto, user);
  }

  @Get('staff/:id')
  @ApiOperation({
    summary: 'One campaign for its management page with all updates (ADMIN, CASE_OFFICER)',
  })
  @ApiNotFoundResponse({ description: 'campaign_not_found' })
  getForStaff(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.campaigns.getForStaff(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Edit titles, anonymised summaries, cover illustration, area and priority (ADMIN, CASE_OFFICER)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaigns.update(id, dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغيير حالة الحملة / إيقاف التعهدات (ADMIN, CASE_OFFICER)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaigns.updateStatus(id, dto, user);
  }

  @Post(':id/updates')
  @ApiOperation({ summary: 'نشر تحديث للحملة (STAFF, CASE_OFFICER, ADMIN)' })
  addUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCampaignUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaigns.addUpdate(id, dto, user);
  }
}
