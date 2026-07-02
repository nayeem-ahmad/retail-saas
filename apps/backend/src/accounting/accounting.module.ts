import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { TenantRoleGuard } from '../auth/tenant-role.guard';
import { StorePermissionGuard } from '../auth/store-permission.guard';
import { SubscriptionAccessGuard } from '../auth/subscription-access.guard';
import { AuditService } from '../audit/audit.service';

@Module({
    controllers: [AccountingController],
    providers: [AccountingService, StorePermissionGuard, TenantRoleGuard, SubscriptionAccessGuard, AuditService],
})
export class AccountingModule {}