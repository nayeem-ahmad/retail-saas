import { StorePermission } from '@erp71/shared-types';

type SyncParams = {
    tenantId: string;
    userIds: string[];
    tenantRoleId: string;
    grantedBy: string;
};

export async function syncMemberPermissionsFromRole(tx: any, params: SyncParams): Promise<number> {
    const { tenantId, userIds, tenantRoleId, grantedBy } = params;
    if (userIds.length === 0) return 0;

    const permRows = await tx.tenantRolePermission.findMany({
        where: { tenant_role_id: tenantRoleId },
        select: { permission: true },
    });
    const permissions: StorePermission[] = permRows.map((r: any) => r.permission);

    const accessRows = await tx.userStoreAccess.findMany({
        where: { tenant_id: tenantId, user_id: { in: userIds } },
        select: { user_id: true, store_id: true },
    });

    await tx.userStorePermission.deleteMany({
        where: { tenant_id: tenantId, user_id: { in: userIds } },
    });

    if (permissions.length > 0 && accessRows.length > 0) {
        await tx.userStorePermission.createMany({
            data: accessRows.flatMap((a: any) =>
                permissions.map((permission) => ({
                    user_id: a.user_id,
                    store_id: a.store_id,
                    tenant_id: tenantId,
                    permission,
                    granted_by: grantedBy,
                })),
            ),
            skipDuplicates: true,
        });
    }

    return userIds.length;
}