const { AccountCategory, AccountType } = require('./accounting.constants.js');

const DEFAULT_ACCOUNTING_TEMPLATE = [
	{
		name: 'Current Assets',
		type: AccountType.ASSET,
		subgroups: [
			{
				name: 'Cash and Bank',
				accounts: [
					{
						name: 'Cash in Hand',
						code: '1010',
						type: AccountType.ASSET,
						category: AccountCategory.CASH,
					},
					{
						name: 'Main Bank Account',
						code: '1020',
						type: AccountType.ASSET,
						category: AccountCategory.BANK,
					},
				],
			},
		],
	},
	{
		name: 'Current Liabilities',
		type: AccountType.LIABILITY,
		subgroups: [
			{
				name: 'Trade Payables',
				accounts: [
					{
						name: 'Purchase Payable',
						code: '2010',
						type: AccountType.LIABILITY,
						category: AccountCategory.GENERAL,
					},
				],
			},
		],
	},
	{
		name: 'Owner Equity',
		type: AccountType.EQUITY,
		subgroups: [
			{
				name: 'Capital',
				accounts: [
					{
						name: "Owner's Equity",
						code: '3010',
						type: AccountType.EQUITY,
						category: AccountCategory.GENERAL,
					},
				],
			},
		],
	},
	{
		name: 'Operating Revenue',
		type: AccountType.REVENUE,
		subgroups: [
			{
				name: 'Sales',
				accounts: [
					{
						name: 'Sales Revenue',
						code: '4010',
						type: AccountType.REVENUE,
						category: AccountCategory.GENERAL,
					},
				],
			},
		],
	},
	{
		name: 'Operating Expenses',
		type: AccountType.EXPENSE,
		subgroups: [
			{
				name: 'General Expenses',
				accounts: [
					{
						name: 'General Operating Expense',
						code: '5010',
						type: AccountType.EXPENSE,
						category: AccountCategory.GENERAL,
					},
				],
			},
		],
	},
];

async function bootstrapDefaultAccountingForTenant(db, tenantId) {
	for (const groupDefinition of DEFAULT_ACCOUNTING_TEMPLATE) {
		const group = await db.accountGroup.upsert({
			where: {
				tenant_id_name: {
					tenant_id: tenantId,
					name: groupDefinition.name,
				},
			},
			update: {
				type: groupDefinition.type,
			},
			create: {
				tenant_id: tenantId,
				name: groupDefinition.name,
				type: groupDefinition.type,
			},
		});

		for (const subgroupDefinition of groupDefinition.subgroups) {
			const subgroup = await db.accountSubgroup.upsert({
				where: {
					group_id_name: {
						group_id: group.id,
						name: subgroupDefinition.name,
					},
				},
				update: {},
				create: {
					tenant_id: tenantId,
					group_id: group.id,
					name: subgroupDefinition.name,
				},
			});

			for (const accountDefinition of subgroupDefinition.accounts) {
				await db.account.upsert({
					where: {
						tenant_id_name: {
							tenant_id: tenantId,
							name: accountDefinition.name,
						},
					},
					update: {
						group_id: group.id,
						subgroup_id: subgroup.id,
						code: accountDefinition.code,
						type: accountDefinition.type,
						category: accountDefinition.category,
					},
					create: {
						tenant_id: tenantId,
						group_id: group.id,
						subgroup_id: subgroup.id,
						name: accountDefinition.name,
						code: accountDefinition.code,
						type: accountDefinition.type,
						category: accountDefinition.category,
					},
				});
			}
		}
	}
}

module.exports = {
	DEFAULT_ACCOUNTING_TEMPLATE,
	bootstrapDefaultAccountingForTenant,
};