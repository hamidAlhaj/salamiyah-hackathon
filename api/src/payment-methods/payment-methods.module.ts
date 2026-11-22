import { Module } from '@nestjs/common';
import {
  CampaignPaymentAccountsController,
  PublicPaymentMethodsController,
} from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  controllers: [PublicPaymentMethodsController, CampaignPaymentAccountsController],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
