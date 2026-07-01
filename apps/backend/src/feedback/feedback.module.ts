import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { FeedbackController } from './feedback.controller';
import { AdminFeedbackController } from './admin-feedback.controller';

@Module({
    imports: [DatabaseModule, EmailModule, PlatformSettingsModule],
    controllers: [FeedbackController, AdminFeedbackController],
})
export class FeedbackModule {}
