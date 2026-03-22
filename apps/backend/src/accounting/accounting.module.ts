import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { TenantRoleGuard } from '../auth/tenant-role.guard';
import { SubscriptionAccessGuard } from '../auth/subscription-access.guard';

@Module({
    controllers: [AccountingController],
    providers: [AccountingService, TenantRoleGuard, SubscriptionAccessGuard],
})
export class AccountingModule {}