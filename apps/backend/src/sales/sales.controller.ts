import { Controller, Post, Get, Body, Param, UseGuards, UseInterceptors, Patch } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    async create(@Tenant() tenant: TenantContext, @Body() dto: CreateSaleDto) {
        return this.salesService.create(tenant.tenantId, dto);
    }

    @Get()
    async findAll(@Tenant() tenant: TenantContext) {
        return this.salesService.findAll(tenant.tenantId);
    }

    @Get(':id')
    async findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.salesService.findOne(tenant.tenantId, id);
    }

    @Patch(':id')
    async update(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateSaleDto) {
        return this.salesService.update(tenant.tenantId, id, dto);
    }
}
