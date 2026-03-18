import { Controller, Post, Get, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Post()
    async create(@Tenant() tenant: TenantContext, @Body() dto: CreateCustomerDto) {
        return this.customersService.create(tenant.tenantId, dto);
    }

    @Get()
    async findAll(@Tenant() tenant: TenantContext) {
        return this.customersService.findAll(tenant.tenantId);
    }

    @Get(':id/history')
    async getHistory(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.customersService.findOne(tenant.tenantId, id);
    }
}
