import { Module } from '@nestjs/common';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';
import { NavigationAdminController } from './navigation-admin.controller';

@Module({
    imports: [PlatformSettingsModule],
    controllers: [NavigationController, NavigationAdminController],
    providers: [NavigationService],
    exports: [NavigationService],
})
export class NavigationModule {}