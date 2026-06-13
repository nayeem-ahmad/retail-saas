import { Body, Controller, Get, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Tenant, TenantContext } from '../database/tenant.decorator';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { AiService } from './ai.service';
import { NarrateReportDto, DraftMessageDto } from './ai.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Get('usage')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(TenantInterceptor)
    getUsage(@Tenant() tenant: TenantContext) {
        return this.aiService.getUsageSummary(tenant.tenantId);
    }

    @Post('narrate-report')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(TenantInterceptor)
    narrateReport(@Tenant() tenant: TenantContext, @Body() dto: NarrateReportDto) {
        return this.aiService.narrateReport(tenant.tenantId, dto);
    }

    @Post('draft-message')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(TenantInterceptor)
    draftMessage(@Tenant() tenant: TenantContext, @Body() dto: DraftMessageDto) {
        return this.aiService.draftMessage(tenant.tenantId, dto);
    }
}
