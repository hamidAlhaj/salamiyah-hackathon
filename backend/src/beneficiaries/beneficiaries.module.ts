import { Module } from '@nestjs/common';
import {
  BeneficiariesController,
  PublicCampaignBeneficiariesController,
} from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';

@Module({
  controllers: [PublicCampaignBeneficiariesController, BeneficiariesController],
  providers: [BeneficiariesService],
})
export class BeneficiariesModule {}
