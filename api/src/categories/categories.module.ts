import { Module } from '@nestjs/common';
import { CategoriesController, PublicCategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [PublicCategoriesController, CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
