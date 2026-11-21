import { Module } from '@nestjs/common';
import { PledgesController } from './pledges.controller';
import { PledgesService } from './pledges.service';

@Module({
  controllers: [PledgesController],
  providers: [PledgesService],
})
export class PledgesModule {}
