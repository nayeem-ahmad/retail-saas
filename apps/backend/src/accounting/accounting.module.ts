import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { TenantRoleGuard } from '../auth/tenant-role.guard';

@Module({
    controllers: [AccountingController],
    providers: [AccountingService, TenantRoleGuard],
})
export class AccountingModule {}