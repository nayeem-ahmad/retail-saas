#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = path.resolve('src/app/dashboard');

const commonReplacements = [
  ["'Back to Accounting'", 't.accountingShared.backToAccounting'],
  ['"Back to Accounting"', 't.accountingShared.backToAccounting'],
  ["title=\"View\"", 'title={t.common.view}'],
  ["title=\"Edit\"", 'title={t.common.edit}'],
  ["title=\"Delete\"", 'title={t.common.delete}'],
  ["title=\"Print\"", 'title={t.purchaseOrders.print}'],
  ["emptyMessage=\"No accounts found for the selected filters\"", 'emptyMessage={t.coa.emptyMessage}'],
  ["searchPlaceholder=\"Search accounts by name or code...\"", 'searchPlaceholder={t.coa.searchPlaceholder}'],
  ["title=\"Chart of Accounts\"", 'title={t.coa.title}'],
  ["title=\"Groups\"", 'title={t.coa.groups}'],
  ["subtitle=\"Top-level financial structure\"", 'subtitle={t.coa.groupsSubtitle}'],
  ["title=\"Subgroups\"", 'title={t.coa.subgroups}'],
  ["subtitle=\"Reusable hierarchy beneath groups\"", 'subtitle={t.coa.subgroupsSubtitle}'],
  ["title=\"New Group\"", 'title={t.coa.newGroup}'],
  ["subtitle=\"Create top-level financial groups\"", 'subtitle={t.coa.createGroupHint}'],
  ["title=\"New Subgroup\"", 'title={t.coa.newSubgroup}'],
  ["subtitle=\"Attach subgroups beneath a selected group\"", 'subtitle={t.coa.createSubgroupHint}'],
  ["title=\"New Account\"", 'title={t.coa.newAccount}'],
  ["subtitle=\"Create posting accounts with type and category\"", 'subtitle={t.coa.createAccountHint}'],
  ["label=\"Filter by group\"", 'label={t.coa.filterByGroup}'],
  ["label=\"Filter by type\"", 'label={t.coa.filterByType}'],
  ["label=\"Filter by category\"", 'label={t.coa.filterByCategory}'],
  ["header: 'Account'", 'header: t.accountingShared.account'],
  ["header: 'Type'", 'header: t.accountingShared.type'],
  ["header: 'Category'", 'header: t.accountingShared.category'],
  ["header: 'Group'", 'header: t.accountingShared.group'],
  ["header: 'Subgroup'", 'header: t.accountingShared.subgroup'],
  ["|| 'No code'", '|| t.accountingShared.noCode'],
  ["|| 'Unassigned'", '|| t.coa.unassigned'],
  ["title=\"Posting Rules\"", 'title={t.postingRules.title}'],
  ["title=\"Posting Events\"", 'title={t.accountingShared.postingEvents}'],
  ["title=\"Accounting Journal\"", 'title={t.journal.accountingJournal}'],
  ["emptyMessage=\"No vouchers found for the selected filters\"", 'emptyMessage={t.journal.emptyMessage}'],
  ["searchPlaceholder=\"Search journal rows by voucher number, description, or type...\"", 'searchPlaceholder={t.journal.searchPlaceholder}'],
  ["title=\"General Ledger\"", 'title={t.accountingShared.generalLedger}'],
  ["emptyMessage=\"No ledger movements were found for the selected account and date range\"", 'emptyMessage={t.ledger.emptyMessage}'],
  ["searchPlaceholder=\"Search ledger rows by voucher number, narration, or voucher type...\"", 'searchPlaceholder={t.ledger.searchPlaceholder}'],
  ["title=\"Cash Transactions\"", 'title={t.accountingShared.cashTransactions}'],
  ["emptyMessage=\"No cash transactions in this period\"", 'emptyMessage={t.accountingShared.noCashTransactions}'],
  ["searchPlaceholder=\"Search transactions...\"", 'searchPlaceholder={t.accountingShared.searchTransactions}'],
  ["title=\"Bank Transactions\"", 'title={t.accountingShared.bankTransactions}'],
  ["emptyMessage=\"No bank transactions in this period\"", 'emptyMessage={t.accountingShared.noBankTransactions}'],
  ["label=\"Opening balance\"", 'label={t.ledger.openingBalance}'],
  ["label=\"Period movement\"", 'label={t.ledger.periodMovement}'],
  ["label=\"Closing balance\"", 'label={t.accountingShared.closingBalance}'],
  ["'Awaiting selection'", 't.accountingShared.awaitingSelection'],
  ["message=\"Loading account options...\"", 'message={t.accountingShared.loadingAccountOptions}'],
  ["message=\"Loading ledger report...\"", 'message={t.accountingShared.loadingLedgerReport}'],
  ["<span>Total Revenue</span>", '<span>{t.reports.totalRevenue}</span>'],
  ["<span>Total Expenses</span>", '<span>{t.reports.totalExpenses}</span>'],
  ["label=\"Assets\"", 'label={t.reports.assets}'],
  ["label=\"Liabilities\"", 'label={t.reports.liabilities}'],
  ["label=\"Equity\"", 'label={t.reports.equity}'],
  ["label=\"Operating Activities\"", 'label={t.reports.cashFlow.operating}'],
  ["label=\"Investing Activities\"", 'label={t.reports.cashFlow.investing}'],
  ["label=\"Financing Activities\"", 'label={t.reports.cashFlow.financing}'],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name === 'page.tsx' && !ent.name.includes('test')) acc.push(p);
  }
  return acc;
}

const dirs = ['accounting'].map((d) => path.join(root, d));
let changed = 0;
for (const dir of dirs) {
  for (const file of walk(dir)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('useI18n')) continue;
    const orig = content;
    for (const [from, to] of commonReplacements) {
      content = content.split(from).join(to);
    }
    if (content !== orig) {
      fs.writeFileSync(file, content);
      changed++;
      console.log('updated', file);
    }
  }
}
console.log('changed files:', changed);