import { Controller, Post, Get, Patch, Body, Param, UseGuards, UseInterceptors, Delete } from '@nestjs/common';
import { SalesQuotationsService } from './sales-quotations.service';
import { CreateQuotationDto, UpdateQuotationDto, UpdateQuotationStatusDto } from './sales-quotations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';

@Controller('sales-quotations')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class SalesQuotationsController {
    constructor(private readonly quotationsService: SalesQuotationsService) {}

    @Post()
    async create(@Tenant() tenant: TenantContext, @Body() dto: CreateQuotationDto) {
        return this.quotationsService.create(tenant.tenantId, dto);
    }

    @Get()
    async findAll(@Tenant() tenant: TenantContext) {
        return this.quotationsService.findAll(tenant.tenantId);
    }

    @Get(':id')
    async findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.quotationsService.findOne(tenant.tenantId, id);
    }

    @Patch(':id')
    async update(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateQuotationDto) {
        return this.quotationsService.update(tenant.tenantId, id, dto);
    }

    @Patch(':id/status')
    async updateStatus(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateQuotationStatusDto) {
        return this.quotationsService.updateStatus(tenant.tenantId, id, dto);
    }

    @Post(':id/revise')
    async revise(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.quotationsService.revise(tenant.tenantId, id);
    }

    @Post(':id/convert')
    async convertToOrder(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.quotationsService.convertToOrder(tenant.tenantId, id);
    }

    @Delete(':id')
    async remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.quotationsService.remove(tenant.tenantId, id);
    }
}
