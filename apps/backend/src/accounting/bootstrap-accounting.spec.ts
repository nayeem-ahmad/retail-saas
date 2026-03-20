import { bootstrapDefaultAccountingForTenant } from '@retail-saas/database';

describe('bootstrapDefaultAccountingForTenant — Story 30.2', () => {
    it('upserts the default account skeleton without failing on rerun', async () => {
        const accountGroup = {
            upsert: jest.fn().mockImplementation(async ({ create }: any) => ({
                id: `${create.name}-id`,
                ...create,
            })),
        };
        const accountSubgroup = {
            upsert: jest.fn().mockImplementation(async ({ create }: any) => ({
                id: `${create.name}-id`,
                ...create,
            })),
        };
        const account = {
            upsert: jest.fn().mockResolvedValue({ id: 'account-id' }),
        };

        const db = {
            accountGroup,
            accountSubgroup,
            account,
        } as any;

        await bootstrapDefaultAccountingForTenant(db, 'tenant-1');
        await bootstrapDefaultAccountingForTenant(db, 'tenant-1');

        expect(accountGroup.upsert).toHaveBeenCalled();
        expect(accountSubgroup.upsert).toHaveBeenCalled();
        expect(account.upsert).toHaveBeenCalled();
        expect(account.upsert.mock.calls.length).toBeGreaterThanOrEqual(5);
    });
});