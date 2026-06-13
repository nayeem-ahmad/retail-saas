import { Module } from '@nestjs/common';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';
import { DatabaseCheck } from './checks/database.check';
import { RedisCheck } from './checks/redis.check';
import { ExternalCheck } from './checks/external.check';

/**
 * System health monitoring (Phase 0-1): deep dependency checks for platform
 * admins. DatabaseService and RedisService come from their @Global() modules.
 */
@Module({
    controllers: [SystemHealthController],
    providers: [
        SystemHealthService,
        DatabaseCheck,
        RedisCheck,
        ExternalCheck,
        PlatformAdminGuard,
    ],
})
export class SystemHealthModule {}
