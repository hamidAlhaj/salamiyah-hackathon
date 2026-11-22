import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { ListOutboxQueryDto, NextOutboxQueryDto } from './outbox.dto';
import { OutboxService } from './outbox.service';

/** Any signed-in user; every query is scoped to the caller's own notifications. */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'My notifications (newest 50)' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.listMine(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'How many of my notifications are unread (bell / badge)' })
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark one of my notifications as read' })
  read(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(user.id, id);
  }
}

/** The WhatsApp outbox (ADMIN, checked in OutboxService). */
@ApiTags('outbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('outbox')
export class OutboxController {
  constructor(private readonly outbox: OutboxService) {}

  @Get()
  @ApiOperation({
    summary: 'Outbox messages with their wa.me link, filterable by kind and status',
  })
  list(@Query() query: ListOutboxQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.outbox.list(query, user);
  }

  @Get('next')
  @ApiOperation({ summary: '"Next" mode: the oldest queued message' })
  next(@Query() query: NextOutboxQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.outbox.next(query.template, user);
  }

  @Post(':id/opened')
  @ApiOperation({ summary: 'The wa.me link was opened: QUEUED → OPENED' })
  opened(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.outbox.markOpened(id, user);
  }
}
