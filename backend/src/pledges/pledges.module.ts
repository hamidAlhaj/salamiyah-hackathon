import { Module } from '@nestjs/common';
import { OfficialReceiptsController, PledgesController } from './pledges.controller';
import { AllocationService } from './allocation.service';
import { PledgesService } from './pledges.service';

@Module({
  controllers: [OfficialReceiptsController, PledgesController],
  providers: [PledgesService, AllocationService],
  exports: [AllocationService],
})
export class PledgesModule {}
