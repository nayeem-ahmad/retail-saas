export type ContextualHelpContent = {
    panelKey: string;
    title: string;
    summary: string;
    steps: string[];
    learnMoreHref?: string;
};

export const COA_HELP: ContextualHelpContent = {
    panelKey: 'help-dismissed-coa',
    title: 'Chart of Accounts quick guide',
    summary: 'Your COA is the master list of financial accounts. Groups and subgroups organise accounts; every voucher line posts to a specific account.',
    steps: [
        'Start with the default bootstrap skeleton — cash, bank, revenue, and expense accounts are pre-created.',
        'Add groups by type (asset, liability, equity, revenue, expense) before creating accounts.',
        'Use subgroups to mirror how you report — e.g. “Cash and Bank” under Current Assets.',
        'Assign each posting account a category: cash, bank, or general — this drives payment and reconciliation flows.',
        'Keep account codes short and consistent; they appear on vouchers, exports, and posting rules.',
    ],
    learnMoreHref: '/dashboard/help',
};

export const COA_FIELD_HELP = {
    page: 'The Chart of Accounts lists every ledger account. Operational events (sales, purchases, adjustments) post debits and credits to these accounts.',
    group: 'Top-level buckets such as Current Assets or Operating Expenses. Each group has one account type.',
    subgroup: 'Optional layer under a group — useful when you need finer reporting without creating many top-level groups.',
    account: 'The actual posting target. Choose type and category carefully; posting rules reference these accounts.',
    accountType: 'Asset, liability, equity, revenue, or expense — determines where the account appears on financial reports.',
    accountCategory: 'Cash and bank accounts are used for payment reconciliation; general accounts cover everything else.',
} as const;

export const POSTING_RULES_HELP: ContextualHelpContent = {
    panelKey: 'help-dismissed-posting-rules',
    title: 'Posting rules quick guide',
    summary: 'Posting rules tell the system which accounts to debit and credit when operational events occur — sales, purchases, returns, and stock adjustments.',
    steps: [
        'Each rule maps one event type (e.g. Sale) to a debit account and a credit account.',
        'Use conditions to split behaviour — e.g. different accounts for cash vs card payments.',
        'Lower priority numbers win when multiple rules match the same event.',
        'Deactivate a rule instead of deleting it if you need to pause automatic postings temporarily.',
        'After changing rules, test with a small sale or purchase and verify the journal voucher.',
    ],
    learnMoreHref: '/dashboard/help',
};

export const POSTING_RULES_FIELD_HELP = {
    page: 'Posting rules automate double-entry vouchers from POS, purchases, and inventory events. Edit debit/credit accounts to match your COA.',
    debit: 'The account increased on this side of the entry — e.g. Cash or Accounts Receivable for a cash sale.',
    credit: 'The account decreased or credited — e.g. Sales Revenue for a cash sale.',
    priority: 'When several rules match, the lowest priority number is applied first.',
    active: 'Inactive rules are ignored; use this to test COA changes without removing automation.',
    eventType: 'The business event that triggers the rule — sale, purchase, return, inventory adjustment, or fund movement.',
} as const;

export const STOCK_TAKES_HELP: ContextualHelpContent = {
    panelKey: 'help-dismissed-stock-takes',
    title: 'Stock take quick guide',
    summary: 'A stock take compares physical counts to system quantities. Variances update inventory and may require manager review before posting.',
    steps: [
        'Pause or minimise stock movements in the warehouse before starting a session.',
        'Create a session per warehouse — counting is scoped to one location at a time.',
        'Enter counted quantities line by line; save frequently to avoid losing progress.',
        'Large variances move the session to Review — a manager approves before posting.',
        'Posting applies adjustments to inventory and may trigger accounting entries via posting rules.',
    ],
    learnMoreHref: '/dashboard/help',
};

export const STOCK_TAKES_FIELD_HELP = {
    page: 'Stock takes reconcile on-hand inventory with a physical count. Discrepancies become adjustment entries after review.',
    warehouse: 'Select the location being counted. Each session covers one warehouse.',
    startImmediately: 'When checked, the session opens in COUNTING status so counters can begin right away.',
    countedQuantity: 'Physical count on the shelf. Variance = counted minus expected system quantity.',
    reason: 'Required for significant discrepancies — documents why stock differs (damage, theft, data error).',
    review: 'Sessions above the approval threshold must be reviewed before inventory is adjusted.',
    post: 'Final step — writes variances to inventory. Cannot be undone without a reversing adjustment.',
} as const;

export const STOCK_TAKE_DETAIL_HELP: ContextualHelpContent = {
    panelKey: 'help-dismissed-stock-take-detail',
    title: 'Counting workflow',
    summary: 'Work through each product line, save counts, then move to review (if needed) and post when approved.',
    steps: [
        'Enter counted quantities and optional notes for each SKU.',
        'Click Save Counts often — especially on long sessions.',
        'Move to Review when counting is complete; large variances require approval.',
        'Post Session only after review — this updates live inventory balances.',
    ],
    learnMoreHref: '/dashboard/help',
};