import { syncMemberPermissionsFromRole } from './role-sync.util';
import { StorePermission } from '@erp71/shared-types';

describe('syncMemberPermissionsFromRole', () => {
    it('rewrites UserStorePermission for each user×store access', async () => {
        const tx = {
            tenantRolePermission: {
                findMany: jest.fn().mockResolvedValue([
                    { permission: StorePermission.CREATE_SALE },
                    { permission: StorePermission.VIEW_LEDGER },
                ]),
            },
            userStoreAccess: {
                findMany: jest.fn().mockResolvedValue([
                    { user_id: 'u1', store_id: 's1' },
                    { user_id: 'u1', store_id: 's2' },
                ]),
            },
            userStorePermission: {
                deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
                createMany: jest.fn().mockResolvedValue({ count: 4 }),
            },
        };

        const count = await syncMemberPermissionsFromRole(tx, {
            tenantId: 't1',
            userIds: ['u1'],
            tenantRoleId: 'role-1',
            grantedBy: 'owner',
        });

        expect(count).toBe(1);
        expect(tx.userStorePermission.deleteMany).toHaveBeenCalledWith({
            where: { tenant_id: 't1', user_id: { in: ['u1'] } },
        });
        expect(tx.userStorePermission.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({
                    user_id: 'u1',
                    store_id: 's1',
                    permission: StorePermission.CREATE_SALE,
                }),
            ]),
            skipDuplicates: true,
        });
    });

    it('returns 0 when userIds is empty', async () => {
        const count = await syncMemberPermissionsFromRole({} as any, {
            tenantId: 't1',
            userIds: [],
            tenantRoleId: 'r1',
            grantedBy: 'o',
        });
        expect(count).toBe(0);
    });
});