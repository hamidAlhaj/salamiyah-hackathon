import { Module } from '@nestjs/common';
import { LookupsController, PublicCollectionPointsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

@Module({
  controllers: [PublicCollectionPointsController, LookupsController],
  providers: [LookupsService],
})
export class LookupsModule {}
