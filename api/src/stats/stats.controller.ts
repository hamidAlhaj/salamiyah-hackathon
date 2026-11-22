import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { TransparencyStats } from '../common/shared';
import { TransparencyQueryDto } from './stats.dto';
import { StatsService } from './stats.service';

/** Public transparency aggregates: no guard, no identities, demo money apart. */
@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('transparency')
  @ApiOkResponse({
    description: 'Platform totals, breakdowns, monthly series, recent activity',
  })
  transparency(@Query() query: TransparencyQueryDto): Promise<TransparencyStats> {
    return this.stats.transparency(query.lang ?? 'ar');
  }

  /** The same aggregate numbers as a CSV file (no rows about people). */
  @Get('transparency.csv')
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="transparency.csv"')
  async transparencyCsv(@Query() query: TransparencyQueryDto): Promise<string> {
    const data = await this.stats.transparency(query.lang ?? 'ar');
    return this.stats.toCsv(data);
  }
}
