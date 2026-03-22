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

export const VoucherType = {
    CASH_PAYMENT: 'cash_payment',
    CASH_RECEIVE: 'cash_receive',
    BANK_PAYMENT: 'bank_payment',
    BANK_RECEIVE: 'bank_receive',
    FUND_TRANSFER: 'fund_transfer',
    JOURNAL: 'journal',
} as const;

export type VoucherType = (typeof VoucherType)[keyof typeof VoucherType];