#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const targets = [
  'src/app/dashboard/purchase-orders/[id]/page.tsx',
  'src/app/dashboard/purchase-quotations/page.tsx',
  'src/app/dashboard/purchase-quotations/CreatePurchaseQuotationModal.tsx',
  'src/app/dashboard/purchase-returns/CreatePurchaseReturnModal.tsx',
  'src/app/dashboard/purchase-returns/[id]/page.tsx',
  'src/app/dashboard/accounting/journal/page.tsx',
  'src/app/dashboard/accounting/ledger/page.tsx',
  'src/app/dashboard/accounting/reconciliation/page.tsx',
  'src/app/dashboard/accounting/journal/[id]/page.tsx',
  'src/app/dashboard/accounting/reports/cashbook/page.tsx',
  'src/app/dashboard/accounting/reports/bankbook/page.tsx',
];

const replacements = [
  ['title="View"', 'title={t.common.view}'],
  ['title="Delete"', 'title={t.common.delete}'],
  ["header: 'Voucher #'", 'header: t.journal.columns.voucherNumber'],
  ["header: 'Date'", 'header: t.accountingShared.date'],
  ["header: 'Description'", 'header: t.accountingShared.description'],
  ["header: 'Amount'", 'header: t.accountingShared.amount'],
  ["header: 'Detail'", 'header: t.accountingShared.detail'],
  ["header: 'Narration'", 'header: t.accountingShared.narration'],
  ["header: 'Debit'", 'header: t.accountingShared.debit'],
  ["header: 'Credit'", 'header: t.accountingShared.credit'],
  ["header: 'Running balance'", 'header: t.ledger.columns.runningBalance'],
  ["header: 'Event'", 'header: t.postingExceptions.columns.event'],
  ["header: 'Module'", 'header: t.postingExceptions.columns.module'],
  ["header: 'Source'", 'header: t.postingExceptions.columns.source'],
  ["header: 'Status'", 'header: t.accountingShared.status'],
  ["header: 'Attempts'", 'header: t.postingExceptions.columns.attempts'],
  ["header: 'Last Error'", 'header: t.postingExceptions.columns.lastError'],
  ["header: 'Voucher'", 'header: t.postingExceptions.columns.voucher'],
  ["header: 'Last Attempt'", 'header: t.postingExceptions.columns.lastAttempt'],
  ["header: 'Receipts'", 'header: t.reports.cashbook.receipts'],
  ["header: 'Payments'", 'header: t.reports.cashbook.payments'],
  ["header: 'Balance'", 'header: t.reports.cashbook.balance'],
  ["header: 'Deposits'", 'header: t.reports.bankbook.deposits'],
  ["header: 'Withdrawals'", 'header: t.reports.bankbook.withdrawals'],
  ['>Supplier</p>', '>{t.common.supplier}</p>'],
  ['>Branch</p>', '>{t.common.branch}</p>'],
  ['>Items</h2>', '>{t.purchaseOrders.detail.items}</h2>'],
  ['>Actions</h2>', '>{t.purchaseQuotations.detail.actions}</h2>'],
  ['>Reference</h3>', '>{t.purchaseReturns.detail.reference}</h3>'],
  ['>Notes</h3>', '>{t.common.notes}</h3>'],
  ['>Cancel</span>', '>{t.common.cancel}</span>'],
  ['>Edit</span>', '>{t.common.edit}</span>'],
  ['Loading purchase return...', '{t.purchaseReturns.detail.loading}'],
  ['Purchase return not found', '{t.purchaseReturns.detail.notFound}'],
  ['Purchase return documentation', '{t.purchaseReturns.detail.printFooter}'],
  ['placeholder="Search by name or SKU..."', 'placeholder={t.purchaseShared.searchProductsShort}'],
  ['placeholder="Notes or special requirements..."', 'placeholder={t.purchaseShared.notesRequirementsPlaceholder}'],
  ['placeholder="Purchase #, supplier, or product"', 'placeholder={t.purchaseReturns.modal.searchPlaceholder}'],
  ['placeholder="Optional supplier reference"', 'placeholder={t.purchaseReturns.modal.referencePlaceholder}'],
  ['placeholder="Optional notes"', 'placeholder={t.purchaseReturns.modal.notesPlaceholder}'],
  ['Choose a purchase', '{t.purchaseReturns.modal.choosePurchase}'],
  ['No supplier linked', '{t.purchaseQuotations.detail.noSupplierLinked}'],
  ['Loading voucher detail...', '{t.journal.detail.loading}'],
  ['Loading posting events...', '{t.postingExceptions.title}...'],
  ['No narration', '{t.accountingShared.noNarration}'],
  ['Not provided', '{t.accountingShared.notProvided}'],
  ['Balanced', '{t.accountingShared.balanced}'],
  ['Totals', '{t.accountingShared.totals}'],
  ['Select an account', '{t.accountingShared.selectAccount}'],
  ['Ledger filters', '{t.ledger.title}'],
  ['Journal filters', '{t.journal.title}'],
  ['Voucher type', '{t.accountingShared.type}'],
  ['>From</span>', '>{t.accountingShared.from}</span>'],
  ['>To</span>', '>{t.accountingShared.to}</span>'],
  ['>Account</span>', '>{t.accountingShared.account}</span>'],
  ['>Results</p>', '>{t.journal.title}</p>'],
  ['>Narration</p>', '>{t.accountingShared.narration}</p>'],
  ['>Account</th>', '>{t.accountingShared.account}</th>'],
  ['>Group</th>', '>{t.accountingShared.group}</th>'],
  ['>Debit</th>', '>{t.accountingShared.debit}</th>'],
  ['>Credit</th>', '>{t.accountingShared.credit}</th>'],
  ['>Comment</th>', '>{t.accountingShared.comment}</th>'],
  ['>Total</th>', '>{t.common.total}</th>'],
  ['>Purchased</th>', '>{t.purchaseReturns.modal.purchased}</th>'],
  ['>Remaining</th>', '>{t.purchaseReturns.modal.remaining}</th>'],
  ['>Max</th>', '>{t.purchaseReturns.modal.returnQty}</th>'],
  ['Estimated based on current prices', '{t.purchaseShared.rfqTotalHint}'],
  ['Calculated from client-side quantity caps and purchase unit costs', '{t.purchaseReturns.modal.returnTotalHint}'],
  ["setError('Add at least one product.')", 'setError(t.purchaseShared.addOneProduct)'],
  ["setError(err.message || 'Failed to create RFQ')", 'setError(err.message || t.purchaseShared.failedCreateRfq)'],
  ["setError('Failed to load purchase quotation')", 'setError(t.purchaseQuotations.detail.loadFailed)'],
];

let changed = 0;
for (const rel of targets) {
  const file = path.resolve(rel);
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  for (const [from, to] of replacements) content = content.split(from).join(to);
  if (content !== orig) {
    fs.writeFileSync(file, content);
    changed++;
    console.log('updated', rel);
  }
}
console.log('changed', changed);