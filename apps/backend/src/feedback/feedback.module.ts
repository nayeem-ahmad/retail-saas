import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { FeedbackController } from './feedback.controller';
import { AdminFeedbackController } from './admin-feedback.controller';

@Module({
    imports: [DatabaseModule, EmailModule],
    controllers: [FeedbackController, AdminFeedbackController],
})
export class FeedbackModule {}
