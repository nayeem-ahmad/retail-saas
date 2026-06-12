#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = path.resolve('src/app/dashboard/accounting');

const replacements = [
  ['Loading ledger...', '{t.ledger.loading}'],
  ['Loading vouchers...', '{t.vouchers.loading}'],
  ['Voucher Entry Workbench', '{t.vouchers.workbenchTitle}'],
  ['Narrate the accounting event for audit clarity', '{t.vouchers.narrationPlaceholder}'],
  ['placeholder="Optional row note"', 'placeholder={t.vouchers.optionalRowNote}'],
  ['aria-label="Voucher type"', 'aria-label={t.vouchers.voucherTypeAria}'],
  ['aria-label="Voucher date"', 'aria-label={t.vouchers.voucherDateAria}'],
  ['aria-label="Reference number"', 'aria-label={t.vouchers.referenceAria}'],
  ['aria-label="Description"', 'aria-label={t.vouchers.descriptionAria}'],
  ['label="Debit total"', 'label={t.accountingShared.debitTotal}'],
  ['label="Credit total"', 'label={t.accountingShared.creditTotal}'],
  ['aria-label="Ledger account"', 'aria-label={t.ledger.accountAria}'],
  ['aria-label="Ledger from date"', 'aria-label={t.ledger.fromDateAria}'],
  ['aria-label="Ledger to date"', 'aria-label={t.ledger.toDateAria}'],
  ['aria-label="Journal voucher type"', 'aria-label={t.journal.voucherTypeAria}'],
  ['aria-label="Journal from date"', 'aria-label={t.journal.fromDateAria}'],
  ['aria-label="Journal to date"', 'aria-label={t.journal.toDateAria}'],
  ["label=\"Voucher #\"", 'label={t.journal.columns.voucherNumber}'],
  ["label=\"Type\"", 'label={t.accountingShared.type}'],
  ["label=\"Date\"", 'label={t.accountingShared.date}'],
  ["label=\"Reference\"", 'label={t.accountingShared.reference}'],
  ["|| 'Not provided'", '|| t.accountingShared.notProvided'],
  ['label="Current Ratio"', 'label={t.reports.financialRatios.currentRatio}'],
  ['label="Gross Margin"', 'label={t.reports.financialRatios.grossMargin}'],
  ['label="Net Profit Margin"', 'label={t.reports.financialRatios.netProfitMargin}'],
  ['label="DSO (Days)"', 'label={t.reports.financialRatios.dso}'],
  ['label="DPO (Days)"', 'label={t.reports.financialRatios.dpo}'],
  ['description="Assets / Liabilities (>1 is healthy)"', 'description={t.reports.financialRatios.currentRatioDesc}'],
  ['description="Net Profit / Revenue × 100"', 'description={t.reports.financialRatios.grossMarginDesc}'],
  ['description="Days Sales Outstanding — lower is better"', 'description={t.reports.financialRatios.dsoDesc}'],
  ['description="Days Payable Outstanding"', 'description={t.reports.financialRatios.dpoDesc}'],
  ['>Revenue</p>', '>{t.reports.revenue}</p>'],
  ['>Total Expenses</p>', '>{t.reports.financialRatios.totalExpenses}</p>'],
  ['>Net Profit</p>', '>{t.reports.netProfit}</p>'],
  ['>Total Assets</p>', '>{t.reports.financialRatios.totalAssets}</p>'],
  ['Chart of Accounts', '{t.coa.title}'],
  ['Account Directory', '{t.coa.accountDirectory}'],
  ['Searchable list with type, category, and hierarchy filters', '{t.coa.directorySubtitle}'],
  ['Bootstrap active', '{t.coa.bootstrapActive}'],
  ['Story 30.2', '{t.coa.story}'],
  ['Story 30.8', '{t.ledger.story}'],
  ['Story 30.6', '{t.journal.detail.story}'],
  ['placeholder="Current Assets"', 'placeholder={t.coa.currentAssets}'],
  ['placeholder="Cash and Bank"', 'placeholder={t.coa.cashAndBank}'],
  ['placeholder="Cash in Hand"', 'placeholder={t.coa.cashInHand}'],
  ["|| 'Unknown group'", '|| t.coa.unknownGroup'],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith('.tsx') && !ent.name.includes('.test.')) acc.push(p);
  }
  return acc;
}

let changed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useI18n')) continue;
  const orig = content;
  for (const [from, to] of replacements) content = content.split(from).join(to);
  if (content !== orig) {
    fs.writeFileSync(file, content);
    changed++;
    console.log('updated', file);
  }
}
console.log('changed', changed);