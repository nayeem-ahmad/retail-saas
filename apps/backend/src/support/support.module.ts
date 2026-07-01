import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { SupportController } from './support.controller';
import { AdminSupportController } from './admin-support.controller';

@Module({
    imports: [DatabaseModule, PlatformSettingsModule],
    controllers: [SupportController, AdminSupportController],
})
export class SupportModule {}
