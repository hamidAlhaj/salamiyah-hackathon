import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { LIMITS } from '../common/shared';
import { CreateExpenditureDto } from './expenditures.dto';
import { ExpendituresService } from './expenditures.service';

/** Campaign spending. Roles and payee rules are checked in ExpendituresService. */
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

  @Get('campaigns/:id/expenditures')
  @ApiOperation({ summary: 'Spending of a campaign (FINANCE_VERIFIER, ADMIN, CASE_OFFICER)' })
  list(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expenditures.listForCampaign(id, user);
  }
}
