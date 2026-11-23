import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateCollectionPointDto,
  CreateHospitalDto,
  UpdateCollectionPointDto,
  UpdateHospitalDto,
} from './lookups.dto';
import { LookupsService } from './lookups.service';

/** Public: where a donor can pay cash (no guard). */
@ApiTags('collection-points')
@Controller()
export class PublicCollectionPointsController {
  constructor(private readonly lookups: LookupsService) {}

  @Get('collection-points/active')
  @ApiOperation({ summary: 'Active collection points for cash donations (public)' })
  active() {
    return this.lookups.activeCollectionPoints();
  }
}

/** Reference data: hospitals and collection points. Roles are checked in LookupsService. */
@ApiTags('lookups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class LookupsController {
  constructor(private readonly lookups: LookupsService) {}

  @Get('hospitals')
  @ApiOperation({ summary: 'Active approved hospitals (any signed-in user)' })
  hospitals() {
    return this.lookups.hospitals();
  }

  @Get('hospitals/all')
  @ApiOperation({ summary: 'All hospitals, inactive too, with usage counts (ADMIN)' })
  allHospitals(@CurrentUser() user: AuthenticatedUser) {
    return this.lookups.allHospitals(user);
  }

  @Post('hospitals')
  @ApiOperation({ summary: 'Add a hospital (ADMIN)' })
  createHospital(@Body() dto: CreateHospitalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.lookups.createHospital(dto, user);
  }

  @Patch('hospitals/:id')
  @ApiOperation({ summary: 'Edit or (de)activate a hospital (ADMIN)' })
  updateHospital(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHospitalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lookups.updateHospital(id, dto, user);
  }

  @Get('collection-points')
  @ApiOperation({ summary: 'All collection points (ADMIN, FINANCE_VERIFIER, STAFF)' })
  collectionPoints(@CurrentUser() user: AuthenticatedUser) {
    return this.lookups.collectionPoints(user);
  }

  @Get('collection-points/mine')
  @ApiOperation({ summary: 'Only my assigned collection points (COLLECTOR)' })
  myCollectionPoints(@CurrentUser() user: AuthenticatedUser) {
    return this.lookups.myCollectionPoints(user);
  }

  @Post('collection-points')
  @ApiOperation({ summary: 'Add a collection point (ADMIN)' })
  createCollectionPoint(
    @Body() dto: CreateCollectionPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lookups.createCollectionPoint(dto, user);
  }

  @Patch('collection-points/:id')
  @ApiOperation({ summary: 'Edit or (de)activate a collection point (ADMIN)' })
  updateCollectionPoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lookups.updateCollectionPoint(id, dto, user);
  }
}
