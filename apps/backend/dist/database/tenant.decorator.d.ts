export interface TenantContext {
    tenantId: string;
    storeId?: string;
    userId: string;
}
export declare const Tenant: (...dataOrPipes: unknown[]) => ParameterDecorator;
