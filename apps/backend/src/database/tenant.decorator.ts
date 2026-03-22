import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
    tenantId: string;
    storeId?: string;
    userId: string;
}

export const Tenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): TenantContext => {
        const request = ctx.switchToHttp().getRequest();
        if (request.user?.userId && !request.tenantId) {
            throw new BadRequestException('Tenant context is required for this request.');
        }

        return {
            tenantId: request.tenantId,
            storeId: request.storeId,
            userId: request.user?.userId,
        };
    },
);
