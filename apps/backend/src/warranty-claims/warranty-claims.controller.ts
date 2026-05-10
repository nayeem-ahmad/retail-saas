import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { CreateWarrantyClaimDto, UpdateClaimStatusDto } from './warranty-claims.dto';
import { WarrantyClaimsService } from './warranty-claims.service';

@Controller('warranty-claims')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class WarrantyClaimsController {
    constructor(private readonly service: WarrantyClaimsService) {}

    @Get('lookup')
    lookup(@Tenant() tenant: TenantContext, @Query('serialNumber') serialNumber: string) {
        return this.service.lookup(tenant.tenantId, serialNumber);
    }

    @Get()
    findAll(
        @Tenant() tenant: TenantContext,
        @Query('status') status?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.service.findAll(tenant.tenantId, { status, from, to });
    }

    @Post()
    create(@Tenant() tenant: TenantContext, @Body() dto: CreateWarrantyClaimDto) {
        return this.service.create(tenant.tenantId, dto);
    }

    @Get(':id')
    findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.service.findOne(tenant.tenantId, id);
    }

    @Patch(':id/status')
    updateStatus(@Tenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateClaimStatusDto) {
        return this.service.updateStatus(tenant.tenantId, id, dto);
    }
}
