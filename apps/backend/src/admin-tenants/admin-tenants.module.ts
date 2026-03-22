import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AdminTenantsController } from './admin-tenants.controller';
import { AdminTenantsService } from './admin-tenants.service';

@Module({
    imports: [BillingModule],
    controllers: [AdminTenantsController],
    providers: [AdminTenantsService, PlatformAdminGuard],
})
export class AdminTenantsModule {}