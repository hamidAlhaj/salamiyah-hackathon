import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateBeneficiaryDto,
  LinkBeneficiaryDto,
  ListBeneficiariesQueryDto,
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
