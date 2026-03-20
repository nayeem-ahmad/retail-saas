import { Body, Controller, Get, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { CreateSupplierDto } from './supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) {}

    @Post()
    create(@Tenant() tenant: TenantContext, @Body() dto: CreateSupplierDto) {
        return this.suppliersService.create(tenant.tenantId, dto);
    }

    @Get()
    findAll(@Tenant() tenant: TenantContext) {
        return this.suppliersService.findAll(tenant.tenantId);
    }

    @Get(':id')
    findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.suppliersService.findOne(tenant.tenantId, id);
    }
}