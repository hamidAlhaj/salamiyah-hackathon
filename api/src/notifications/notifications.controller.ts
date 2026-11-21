import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Authenticated } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Authenticated()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'إشعاراتي' })
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.listMine(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'تعليم إشعار كمقروء' })
  read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
