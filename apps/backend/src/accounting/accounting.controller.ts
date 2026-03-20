import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantRoleGuard } from '../auth/tenant-role.guard';
import { TenantRoles } from '../auth/tenant-roles.decorator';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { TenantInterceptor } from '../database/tenant.interceptor';
import {
    CreateVoucherDto,
    CreateAccountDto,
    CreateAccountGroupDto,
    CreateAccountSubgroupDto,
    FinancialKpiQueryDto,
    FinancialTrendQueryDto,
    ListAccountsQueryDto,
    ListLedgerQueryDto,
    ListAccountSubgroupsQueryDto,
    ListVouchersQueryDto,
    VoucherNumberPreviewQueryDto,
} from './accounting.dto';

@Controller('accounting')
@UseGuards(JwtAuthGuard, TenantRoleGuard)
@UseInterceptors(TenantInterceptor)
@TenantRoles('OWNER', 'MANAGER')
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) {}

    @Get()
    getOverview(@Tenant() tenant: TenantContext) {
        return this.accountingService.getModuleOverview(tenant.tenantId);
    }

    @Get('account-groups')
    findAccountGroups(@Tenant() tenant: TenantContext) {
        return this.accountingService.findAccountGroups(tenant.tenantId);
    }

    @Post('account-groups')
    createAccountGroup(@Tenant() tenant: TenantContext, @Body() dto: CreateAccountGroupDto) {
        return this.accountingService.createAccountGroup(tenant.tenantId, dto);
    }

    @Get('account-subgroups')
    findAccountSubgroups(
        @Tenant() tenant: TenantContext,
        @Query() query: ListAccountSubgroupsQueryDto,
    ) {
        return this.accountingService.findAccountSubgroups(tenant.tenantId, query);
    }

    @Post('account-subgroups')
    createAccountSubgroup(@Tenant() tenant: TenantContext, @Body() dto: CreateAccountSubgroupDto) {
        return this.accountingService.createAccountSubgroup(tenant.tenantId, dto);
    }

    @Get('accounts')
    findAccounts(@Tenant() tenant: TenantContext, @Query() query: ListAccountsQueryDto) {
        return this.accountingService.findAccounts(tenant.tenantId, query);
    }

    @Post('accounts')
    createAccount(@Tenant() tenant: TenantContext, @Body() dto: CreateAccountDto) {
        return this.accountingService.createAccount(tenant.tenantId, dto);
    }

    @Get('vouchers')
    findVouchers(@Tenant() tenant: TenantContext, @Query() query: ListVouchersQueryDto) {
        return this.accountingService.findVouchers(tenant.tenantId, query);
    }

    @Get('vouchers/next-number')
    getVoucherNumberPreview(
        @Tenant() tenant: TenantContext,
        @Query() query: VoucherNumberPreviewQueryDto,
    ) {
        return this.accountingService.getVoucherNumberPreview(tenant.tenantId, query.voucherType);
    }

    @Get('vouchers/:id')
    findVoucherById(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.accountingService.findVoucherById(tenant.tenantId, id);
    }

    @Post('vouchers')
    createVoucher(@Tenant() tenant: TenantContext, @Body() dto: CreateVoucherDto) {
        return this.accountingService.createVoucher(tenant.tenantId, dto);
    }

    @Get('dashboard/kpis')
    getFinancialKpis(@Tenant() tenant: TenantContext, @Query() query: FinancialKpiQueryDto) {
        return this.accountingService.getFinancialKpis(tenant.tenantId, query);
    }

    @Get('dashboard/trends')
    getFinancialTrends(@Tenant() tenant: TenantContext, @Query() query: FinancialTrendQueryDto) {
        return this.accountingService.getFinancialTrends(tenant.tenantId, query);
    }

    @Get('reports/ledger/:accountId')
    findLedger(
        @Tenant() tenant: TenantContext,
        @Param('accountId') accountId: string,
        @Query() query: ListLedgerQueryDto,
    ) {
        return this.accountingService.findLedger(tenant.tenantId, accountId, query);
    }
}