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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  BeneficiaryReasonDto,
  CreateBeneficiaryDto,
  CreateBeneficiaryNoteDto,
  LinkBeneficiaryDto,
  ListBeneficiariesQueryDto,
  UpdateBeneficiaryDto,
  UpdateBeneficiaryLinkDto,
} from './beneficiaries.dto';
import { BeneficiariesService } from './beneficiaries.service';

/** Public: anonymised beneficiaries of a campaign (code, kind, area only). */
@ApiTags('beneficiaries')
@Controller('campaigns/:id/beneficiaries')
export class PublicCampaignBeneficiariesController {
  constructor(private readonly beneficiaries: BeneficiariesService) {}

  @Get()
  @ApiOperation({ summary: 'Anonymised beneficiaries of a public campaign (no identities)' })
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiaries.publicForCampaign(id);
  }
}

/** Staff beneficiary registry and campaign links. Roles are checked in BeneficiariesService. */
@ApiTags('beneficiaries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BeneficiariesController {
  constructor(private readonly beneficiaries: BeneficiariesService) {}

  @Get('beneficiaries')
  @ApiOperation({ summary: 'Search beneficiaries (ADMIN, STAFF; includes private names)' })
  list(@Query() query: ListBeneficiariesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.beneficiaries.list(query.q, user);
  }

  @Post('beneficiaries')
  @ApiOperation({ summary: 'Register an anonymised beneficiary → B-XXXX (ADMIN, STAFF)' })
  create(@Body() dto: CreateBeneficiaryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.beneficiaries.create(dto, user);
  }

  @Patch('beneficiaries/:id')
  @ApiOperation({ summary: 'Correct a beneficiary record; the code never changes (ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.beneficiaries.update(id, dto, user);
  }

  @Post('beneficiaries/:id/suspend')
  @ApiOperation({
    summary:
      'Administrative suspension with a reason (ADMIN, audited): intake refuses silently, nothing public changes',
  })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BeneficiaryReasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.beneficiaries.suspend(id, dto, user);
  }

  @Post('beneficiaries/:id/reactivate')
  @ApiOperation({ summary: 'Lift the suspension with a reason (ADMIN, audited)' })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BeneficiaryReasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.beneficiaries.reactivate(id, dto, user);
  }

  @Post('beneficiaries/:id/notes')
  @ApiOperation({
    summary: 'Add a note or a violation to the internal log (ADMIN, never public)',
  })
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBeneficiaryNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.beneficiaries.addNote(id, dto, user);
  }

  @Patch('campaigns/:id/beneficiaries/:beneficiaryId')
  @ApiOperation({ summary: 'Change the monthly amount of a link or end the link (ADMIN)' })
  updateLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('beneficiaryId', ParseUUIDPipe) beneficiaryId: string,
    @Body() dto: UpdateBeneficiaryLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.beneficiaries.updateLink(id, beneficiaryId, dto, user);
  }

  @Post('campaigns/:id/beneficiaries')
  @ApiOperation({
    summary: 'Link a beneficiary to a campaign, optional monthly amount (ADMIN)',
  })
  link(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkBeneficiaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.beneficiaries.linkToCampaign(id, dto, user);
  }
}
