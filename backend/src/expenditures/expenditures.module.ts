import { Module } from '@nestjs/common';
import {
  ExpendituresController,
  PublicExpendituresController,
} from './expenditures.controller';
import { ExpendituresService } from './expenditures.service';

@Module({
  controllers: [PublicExpendituresController, ExpendituresController],
  providers: [ExpendituresService],
})
export class ExpendituresModule {}
