import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { CreateProductGroupDto, UpdateProductGroupDto } from './product-group.dto';
import { ProductGroupsService } from './product-groups.service';

@Controller('product-groups')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class ProductGroupsController {
    constructor(private readonly service: ProductGroupsService) {}

    @Post()
    create(@Tenant() tenant: TenantContext, @Body() dto: CreateProductGroupDto) {
        return this.service.create(tenant.tenantId, dto);
    }

    @Get()
    findAll(@Tenant() tenant: TenantContext) {
        return this.service.findAll(tenant.tenantId);
    }

    @Get(':id')
    findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.service.findOne(tenant.tenantId, id);
    }

    @Patch(':id')
    update(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateProductGroupDto) {
        return this.service.update(tenant.tenantId, id, dto);
    }

    @Delete(':id')
    remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.service.remove(tenant.tenantId, id);
    }
}