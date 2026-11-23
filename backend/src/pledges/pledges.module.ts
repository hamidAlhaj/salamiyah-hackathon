import { Module } from '@nestjs/common';
import { OfficialReceiptsController, PledgesController } from './pledges.controller';
import { PledgesService } from './pledges.service';

@Module({
  controllers: [OfficialReceiptsController, PledgesController],
  providers: [PledgesService],
})
export class PledgesModule {}
