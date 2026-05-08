import { Controller, Post, Get, Patch, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { SegmentsService } from './segments.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
        private readonly segmentsService: SegmentsService,
    ) {}

    @Post()
    async create(@Tenant() tenant: TenantContext, @Body() dto: CreateCustomerDto) {
        return this.customersService.create(tenant.tenantId, dto);
    }

    @Get('segment-stats')
    async getSegmentStats(@Tenant() tenant: TenantContext) {
        return this.customersService.getSegmentStats(tenant.tenantId);
    }

    @Post('run-segmentation')
    async runSegmentation(@Tenant() tenant: TenantContext) {
        return this.segmentsService.runForTenant(tenant.tenantId);
    }

    @Get()
    async findAll(@Tenant() tenant: TenantContext) {
        return this.customersService.findAll(tenant.tenantId);
    }

    @Get(':id')
    async findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.customersService.findOne(tenant.tenantId, id);
    }

    @Get(':id/history')
    async getHistory(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.customersService.findOne(tenant.tenantId, id);
    }

    @Patch(':id')
    async update(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
        return this.customersService.update(tenant.tenantId, id, dto);
    }
}
