import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'سجل التدقيق لكيان محدد' })
  @ApiQuery({ name: 'entityType', example: 'Case' })
  @ApiQuery({ name: 'entityId' })
  list(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.audit.list(entityType, entityId);
  }
}
