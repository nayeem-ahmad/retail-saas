const { ROLE_DEFAULT_PERMISSIONS, UserRole } = require('@erp71/shared-types');

const SYSTEM_ROLES = [
    { key: 'manager', name: 'Manager', role: UserRole.MANAGER },
    { key: 'cashier', name: 'Cashier', role: UserRole.CASHIER },
    { key: 'accountant', name: 'Accountant', role: UserRole.ACCOUNTANT },
];

async function seedDefaultTenantRoles(tx, tenantId) {
    const ids = {};
    for (const entry of SYSTEM_ROLES) {
        const role = await tx.tenantRole.create({
            data: { tenant_id: tenantId, name: entry.name, is_system: true },
        });
        const perms = ROLE_DEFAULT_PERMISSIONS[entry.role] ?? [];
        if (perms.length > 0) {
            await tx.tenantRolePermission.createMany({
                data: perms.map((permission) => ({ tenant_role_id: role.id, permission })),
                skipDuplicates: true,
            });
        }
        ids[entry.key] = role.id;
    }
    return ids;
}

module.exports = { seedDefaultTenantRoles };