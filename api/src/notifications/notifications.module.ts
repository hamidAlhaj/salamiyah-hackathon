import { Global, Module } from '@nestjs/common';
import { MESSAGE_CHANNEL, WaLinkChannel } from './message-channel';
import { NotificationsController, OutboxController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { OutboxService } from './outbox.service';

@Global()
@Module({
  controllers: [NotificationsController, OutboxController],
  providers: [
    NotificationsService,
    OutboxService,
    // The only driver today: one-tap wa.me links. A Cloud API driver would be chosen here later.
    { provide: MESSAGE_CHANNEL, useClass: WaLinkChannel },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
