import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
    tenantId: string;
    storeId?: string;
    userId: string;
}

export const Tenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): TenantContext => {
        const request = ctx.switchToHttp().getRequest();
        return {
            tenantId: request.tenantId,
            storeId: request.storeId,
            userId: request.user?.userId,
        };
    },
);
