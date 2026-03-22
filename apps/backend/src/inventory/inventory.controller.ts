import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import {
    CreateWarehouseDto,
    CreateInventoryReasonDto,
    ListInventoryReasonsQueryDto,
    ListStockLedgerQueryDto,
    UpdateInventoryReasonDto,
    UpdateInventorySettingsDto,
    UpdateWarehouseDto,
} from './inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryController {
    constructor(private readonly service: InventoryService) {}

    @Get('warehouses')
    getWarehouses(@Tenant() tenant: TenantContext) {
        return this.service.getWarehouses(tenant.tenantId);
    }

    @Post('warehouses')
    createWarehouse(@Tenant() tenant: TenantContext, @Body() dto: CreateWarehouseDto) {
        return this.service.createWarehouse(tenant.tenantId, dto);
    }

    @Patch('warehouses/:id')
    updateWarehouse(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
        return this.service.updateWarehouse(tenant.tenantId, id, dto);
    }

    @Get('settings')
    getSettings(@Tenant() tenant: TenantContext) {
        return this.service.getSettings(tenant.tenantId);
    }

    @Patch('settings')
    updateSettings(@Tenant() tenant: TenantContext, @Body() dto: UpdateInventorySettingsDto) {
        return this.service.updateSettings(tenant.tenantId, dto);
    }

    @Get('reasons')
    listReasons(@Tenant() tenant: TenantContext, @Query() query: ListInventoryReasonsQueryDto) {
        return this.service.listReasons(tenant.tenantId, query);
    }

    @Post('reasons')
    createReason(@Tenant() tenant: TenantContext, @Body() dto: CreateInventoryReasonDto) {
        return this.service.createReason(tenant.tenantId, dto);
    }

    @Patch('reasons/:id')
    updateReason(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateInventoryReasonDto) {
        return this.service.updateReason(tenant.tenantId, id, dto);
    }

    @Get('ledger')
    getLedger(@Tenant() tenant: TenantContext, @Query() query: ListStockLedgerQueryDto) {
        return this.service.getLedger(tenant.tenantId, query);
    }
}