import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  PaymentLangQueryDto,
  SetCampaignAccountDto,
  UpdatePaymentMethodConfigDto,
} from './payment-methods.dto';
import { PaymentMethodsService } from './payment-methods.service';

/** Public receiving details (fake accounts for the hackathon). */
@ApiTags('payment-methods')
@Controller()
export class PublicPaymentMethodsController {
  constructor(private readonly payments: PaymentMethodsService) {}

  @Get('payment-methods')
  @ApiOperation({ summary: 'Active payment methods with default receiving accounts' })
  list(@Query() query: PaymentLangQueryDto) {
    return this.payments.listActive(query.lang);
  }

  @Get('campaigns/:id/payment-accounts')
  @ApiOperation({ summary: 'Receiving accounts for this campaign (defaults + overrides)' })
  forCampaign(@Param('id', ParseUUIDPipe) id: string, @Query() query: PaymentLangQueryDto) {
    return this.payments.forCampaign(id, query.lang);
  }
}

/** ADMIN: the default receiving details per method. Roles are checked in PaymentMethodsService. */
@ApiTags('payment-methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-methods/config')
export class PaymentMethodConfigController {
  constructor(private readonly payments: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Every payment method config, inactive too (ADMIN)' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.payments.listConfigs(user);
  }

  @Patch(':method')
  @ApiParam({ name: 'method', enum: PaymentMethod })
  @ApiOperation({ summary: 'Edit a method’s default receiving details (ADMIN)' })
  update(
    @Param('method', new ParseEnumPipe(PaymentMethod)) method: PaymentMethod,
    @Body() dto: UpdatePaymentMethodConfigDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payments.updateConfig(method, dto, user);
  }
}

/** ADMIN per-campaign account overrides. Roles are checked in PaymentMethodsService. */
@ApiTags('payment-methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns/:id/payment-accounts')
export class CampaignPaymentAccountsController {
  constructor(private readonly payments: PaymentMethodsService) {}

  @Get('overrides')
  @ApiOperation({ summary: 'This campaign’s own accounts, any status (ADMIN)' })
  overrides(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.campaignOverrides(id, user);
  }

  @Put(':method')
  @ApiParam({ name: 'method', enum: PaymentMethod })
  @ApiOperation({ summary: 'Set this campaign’s account for a method (ADMIN)' })
  set(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('method', new ParseEnumPipe(PaymentMethod)) method: PaymentMethod,
    @Body() dto: SetCampaignAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payments.setCampaignAccount(id, method, dto, user);
  }

  @Delete(':method')
  @ApiParam({ name: 'method', enum: PaymentMethod })
  @ApiOperation({ summary: 'Back to the default account for a method (ADMIN)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('method', new ParseEnumPipe(PaymentMethod)) method: PaymentMethod,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payments.removeCampaignAccount(id, method, user);
  }
}
