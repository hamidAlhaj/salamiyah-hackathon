import { Module } from '@nestjs/common';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [CampaignsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
