import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequiresFeature } from '../auth/subscription-access.decorator';
import { SubscriptionAccessGuard } from '../auth/subscription-access.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { GetInventoryValuationDto, GetReorderSuggestionsDto, GetShrinkageSummaryDto } from './inventory-reports.dto';
import { InventoryReportsService } from './inventory-reports.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory Reports')
@ApiBearerAuth()
@Controller('inventory-reports')
@UseGuards(JwtAuthGuard, SubscriptionAccessGuard)
@UseInterceptors(TenantInterceptor)
@RequiresFeature('premiumInventoryReports')
export class InventoryReportsController {
    constructor(private readonly service: InventoryReportsService) {}

    @Get('reorder-suggestions')
    getReorderSuggestions(@Tenant() tenant: TenantContext, @Query() query: GetReorderSuggestionsDto) {
        return this.service.getReorderSuggestions(tenant.tenantId, query);
    }

    @Get('valuation')
    getInventoryValuation(@Tenant() tenant: TenantContext, @Query() query: GetInventoryValuationDto) {
        return this.service.getInventoryValuation(tenant.tenantId, query);
    }

    @Get('shrinkage-summary')
    getShrinkageSummary(@Tenant() tenant: TenantContext, @Query() query: GetShrinkageSummaryDto) {
        return this.service.getShrinkageSummary(tenant.tenantId, query);
    }
}