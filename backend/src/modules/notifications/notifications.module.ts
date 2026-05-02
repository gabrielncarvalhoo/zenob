import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  controllers: [NotificationsController],
  providers: [EmailService],
  imports: [WhatsAppModule],
})
export class NotificationsModule {}