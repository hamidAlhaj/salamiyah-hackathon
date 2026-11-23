import { Module } from '@nestjs/common';
import {
  CampaignPaymentAccountsController,
  PaymentMethodConfigController,
  PublicPaymentMethodsController,
} from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  controllers: [
    PublicPaymentMethodsController,
    PaymentMethodConfigController,
    CampaignPaymentAccountsController,
  ],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
