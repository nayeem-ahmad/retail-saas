export const AccountType = {
    ASSET: 'asset',
    LIABILITY: 'liability',
    EQUITY: 'equity',
    REVENUE: 'revenue',
    EXPENSE: 'expense',
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const AccountCategory = {
    CASH: 'cash',
    BANK: 'bank',
    GENERAL: 'general',
} as const;

export type AccountCategory = (typeof AccountCategory)[keyof typeof AccountCategory];