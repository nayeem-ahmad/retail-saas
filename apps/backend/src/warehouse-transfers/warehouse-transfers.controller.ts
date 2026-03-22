import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { CreateWarehouseTransferDto, ListWarehouseTransfersQueryDto, ReceiveWarehouseTransferDto } from './warehouse-transfer.dto';
import { WarehouseTransfersService } from './warehouse-transfers.service';

@Controller('warehouse-transfers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class WarehouseTransfersController {
    constructor(private readonly service: WarehouseTransfersService) {}

    @Post()
    create(@Tenant() tenant: TenantContext, @Body() dto: CreateWarehouseTransferDto) {
        return this.service.create(tenant.tenantId, dto);
    }

    @Get()
    findAll(@Tenant() tenant: TenantContext, @Query() query: ListWarehouseTransfersQueryDto) {
        return this.service.findAll(tenant.tenantId, query);
    }

    @Get(':id')
    findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.service.findOne(tenant.tenantId, id);
    }

    @Post(':id/send')
    send(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.service.send(tenant.tenantId, id);
    }

    @Post(':id/receive')
    receive(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: ReceiveWarehouseTransferDto) {
        return this.service.receive(tenant.tenantId, id, dto);
    }
}