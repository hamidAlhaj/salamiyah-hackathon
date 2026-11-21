import { Module } from '@nestjs/common';
import { CampaignStatsService } from './campaign-stats.service';
import { CampaignsController, PublicCampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  controllers: [PublicCampaignsController, CampaignsController],
  providers: [CampaignsService, CampaignStatsService],
  exports: [CampaignStatsService],
})
export class CampaignsModule {}
