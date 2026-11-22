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
import { LangQueryDto } from '../campaigns/campaigns.dto';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { LIMITS } from '../common/shared';
import { CreateExpenditureDto, MonthlyRunDto } from './expenditures.dto';
import { ExpendituresService } from './expenditures.service';

/** Public: a campaign's spending timeline and its published proofs (no guard). */
@ApiTags('expenditures')
@Controller()
export class PublicExpendituresController {
  constructor(private readonly expenditures: ExpendituresService) {}

  @Get('campaigns/:id/spending')
  @ApiOperation({ summary: 'Public spending timeline (beneficiary codes only)' })
  timeline(@Param('id', ParseUUIDPipe) id: string, @Query() query: LangQueryDto) {
    return this.expenditures.publicTimeline(id, query.lang);
  }

  @Get('expenditures/:id/proof')
  @ApiOperation({ summary: 'A published proof file (404 when not published)' })
  async proof(@Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const { data, mimeType } = await this.expenditures.publicProof(id);
    return new StreamableFile(data, { type: mimeType, disposition: 'inline' });
  }
}

/** Campaign spending for staff. Roles and payee rules are checked in ExpendituresService. */
@ApiTags('expenditures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ExpendituresController {
  constructor(private readonly expenditures: ExpendituresService) {}

  @Post('expenditures')
  @UseInterceptors(FileInterceptor('proof', { limits: { fileSize: LIMITS.maxUploadBytes } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateExpenditureDto })
  @ApiOperation({
    summary: 'Record spending with proof (FINANCE_VERIFIER, amount ≤ remaining)',
  })
  create(
    @Body() dto: CreateExpenditureDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expenditures.create(dto, file, user);
  }

  @Post('campaigns/:id/expenditures/monthly')
  @UseInterceptors(FileInterceptor('proof', { limits: { fileSize: LIMITS.maxUploadBytes } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: MonthlyRunDto })
  @ApiOperation({
    summary: 'Pay one month of sponsorship to every sponsored beneficiary (FINANCE_VERIFIER)',
  })
  monthly(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MonthlyRunDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expenditures.payMonth(id, dto, file, user);
  }

  @Get('campaigns/:id/spending-context')
  @ApiOperation({
    summary: 'Flags, hospital, balance and beneficiaries for the spending page',
  })
  context(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expenditures.spendingContext(id, user);
  }

  @Get('campaigns/:id/expenditures')
  @ApiOperation({ summary: 'Spending of a campaign (FINANCE_VERIFIER, ADMIN, CASE_OFFICER)' })
  list(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expenditures.listForCampaign(id, user);
  }
}
