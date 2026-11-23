import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CategoriesLangQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './categories.dto';
import { CategoriesService } from './categories.service';

/** Public: the active categories (for the campaign filter). */
@ApiTags('categories')
@Controller('categories')
export class PublicCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Active campaign categories, ordered' })
  list(@Query() query: CategoriesLangQueryDto) {
    return this.categories.listPublic(query.lang);
  }
}

/** ADMIN category management. Roles are checked in CategoriesService. */
@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get('all')
  @ApiOperation({
    summary: 'All categories incl. inactive, with flags and campaign counts (ADMIN)',
  })
  listAll(@CurrentUser() user: AuthenticatedUser) {
    return this.categories.listAll(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a generic category (ADMIN; no behaviour flags)' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.categories.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit names/icon/order or activate/deactivate (ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categories.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an unused non-system category (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.categories.remove(id, user);
  }
}
