import { Module } from '@nestjs/common';
import { CasesController, PublicCasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  controllers: [PublicCasesController, CasesController],
  providers: [CasesService],
})
export class CasesModule {}
