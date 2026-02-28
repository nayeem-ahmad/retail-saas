import { Controller, Post, Get, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './sale.dto';
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
}
