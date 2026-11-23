import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'سجل التدقيق لكيان محدد (ADMIN)' })
  @ApiQuery({ name: 'entityType', example: 'Case' })
  @ApiQuery({ name: 'entityId' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.audit.list(user, entityType, entityId);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'سجل الحملة: تعديلات، حالة، صرف، تعهدات وحالتها الطبية (ADMIN)' })
  campaignHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.audit.campaignHistory(user, id);
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'سجل الحالة الطبية وحملتها بعد النشر (ADMIN)' })
  caseHistory(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.audit.caseHistory(user, id);
  }
}
