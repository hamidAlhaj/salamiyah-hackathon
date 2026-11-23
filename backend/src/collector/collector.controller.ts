import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ReferenceParamDto } from './collector.dto';
import { CollectorService } from './collector.service';

/**
 * The collector dashboard (COLLECTOR, checked in CollectorService). Recording an anonymous box total
 * stays POST /pledges/collector.
 */
@ApiTags('collector')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collector')
export class CollectorController {
  constructor(private readonly collector: CollectorService) {}

  @Get('points')
  @ApiOperation({ summary: 'My collection points with their waiting cash pledges count' })
  points(@CurrentUser() user: AuthenticatedUser) {
    return this.collector.points(user);
  }

  @Get('pledges')
  @ApiOperation({ summary: 'Cash pledges waiting to be handed over at my points' })
  pending(@CurrentUser() user: AuthenticatedUser) {
    return this.collector.pending(user);
  }

  @Get('pledges/by-reference/:referenceNo')
  @ApiOperation({
    summary: 'Find a cash pledge at my points by the reference the donor shows',
  })
  byReference(@Param() params: ReferenceParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.collector.byReference(params.referenceNo, user);
  }

  @Post('pledges/:id/confirm')
  @ApiOperation({
    summary: 'Confirm cash received (PLEDGED → COLLECTED + finance verification PENDING)',
  })
  confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.collector.confirm(id, user);
  }

  @Get('history')
  @ApiOperation({ summary: 'What I handed over: confirmed pledges and recorded box totals' })
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.collector.history(user);
  }
}
