import { Controller, Get, Patch, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { PaginationDto } from '../common/pagination.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    list(@Tenant() tenant: TenantContext, @Query() query: PaginationDto) {
        return this.notificationsService.listForUser(tenant.tenantId, tenant.userId, query.page, query.limit);
    }

    @Get('unread-count')
    async unreadCount(@Tenant() tenant: TenantContext) {
        const count = await this.notificationsService.getUnreadCount(tenant.tenantId, tenant.userId);
        return { count };
    }

    @Patch('read-all')
    async markAllRead(@Tenant() tenant: TenantContext) {
        await this.notificationsService.markAllRead(tenant.tenantId, tenant.userId);
        return { success: true };
    }

    @Patch(':id/read')
    markRead(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.notificationsService.markRead(tenant.tenantId, tenant.userId, id);
    }
}
