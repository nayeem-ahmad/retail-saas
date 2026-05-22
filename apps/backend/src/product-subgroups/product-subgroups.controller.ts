import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { CreateProductSubgroupDto, UpdateProductSubgroupDto } from './product-subgroup.dto';
import { ProductSubgroupsService } from './product-subgroups.service';

@Controller('product-subgroups')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class ProductSubgroupsController {
    constructor(private readonly service: ProductSubgroupsService) {}

    @Post()
    create(@Tenant() tenant: TenantContext, @Body() dto: CreateProductSubgroupDto) {
        return this.service.create(tenant.tenantId, dto);
    }

    @Get()
    findAll(@Tenant() tenant: TenantContext, @Query('groupId') groupId?: string) {
        return this.service.findAll(tenant.tenantId, groupId);
    }

    @Get(':id')
    findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.service.findOne(tenant.tenantId, id);
    }

    @Patch(':id')
    update(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateProductSubgroupDto) {
        return this.service.update(tenant.tenantId, id, dto);
    }

    @Delete(':id')
    remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.service.remove(tenant.tenantId, id);
    }
}