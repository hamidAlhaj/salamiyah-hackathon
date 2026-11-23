import { Module } from '@nestjs/common';
import { CasesController, PublicCasesController } from './cases.controller';
import { CaseSlaService } from './case-sla.service';
import { CasesService } from './cases.service';

@Module({
  controllers: [PublicCasesController, CasesController],
  providers: [CasesService, CaseSlaService],
})
export class CasesModule {}
