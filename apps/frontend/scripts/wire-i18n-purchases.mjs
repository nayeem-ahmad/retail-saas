#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = path.resolve('src/app/dashboard');
const dirs = ['purchases', 'purchase-orders', 'purchase-quotations', 'purchase-returns', 'suppliers'];

const replacements = [
  ["window.confirm('Delete this RFQ?')", 'window.confirm(t.purchaseQuotations.deleteConfirm)'],
  ["alert(err.message || 'Failed to delete')", 'alert(err.message || t.purchaseQuotations.deleteFailed)'],
  ["window.confirm(`Convert ${rfq.rfq_number} to a Purchase Order?`)", 'window.confirm(formatMessage(t.purchaseQuotations.convertConfirm, { rfqNumber: rfq.rfq_number }))'],
  ["alert(`Created Purchase Order ${po.po_number}`)", 'alert(formatMessage(t.purchaseQuotations.convertSuccess, { poNumber: po.po_number }))'],
  ["alert(err.message || 'Conversion failed')", 'alert(err.message || t.purchaseQuotations.convertFailed)'],
  ["window.confirm('Are you sure you want to delete this purchase return?')", 'window.confirm(t.purchaseReturns.deleteConfirm)'],
  ["window.alert('Failed to delete purchase return. Please try again.')", 'window.alert(t.purchaseReturns.deleteFailed)'],
  ["header: 'RFQ #'", 'header: t.purchaseQuotations.columns.rfqNumber'],
  ["header: 'Date'", 'header: t.purchaseQuotations.columns.date'],
  ["header: 'Supplier'", 'header: t.purchaseQuotations.columns.supplier'],
  ["header: 'Items'", 'header: t.purchaseQuotations.columns.items'],
  ["header: 'Valid Until'", 'header: t.purchaseQuotations.columns.validUntil'],
  ["header: 'Total'", 'header: t.purchaseQuotations.columns.total'],
  ["header: 'Status'", 'header: t.purchaseQuotations.columns.status'],
  ["header: 'Actions'", 'header: t.purchaseQuotations.columns.actions'],
  ["header: 'Return #'", 'header: t.purchaseReturns.columns.returnNumber'],
  ["header: 'Source Purchase'", 'header: t.purchaseReturns.columns.sourcePurchase'],
  ["header: 'Created'", 'header: t.purchaseReturns.columns.created'],
  ["header: 'Voucher'", 'header: t.purchaseReturns.columns.voucher'],
  ["?? 'Unlinked'", '?? t.purchaseShared.unlinked'],
  ['"No supplier"', 't.purchaseShared.noSupplierShort'],
  ['>No supplier</span>', '>{t.purchaseShared.noSupplierShort}</span>'],
  [' items</span>', '}>{formatMessage(t.purchaseShared.itemsCount, { count: info.getValue() })}</span>'],
  [' lines</span>', '}>{formatMessage(t.purchaseShared.linesCount, { count: info.getValue() })}</span>'],
  ['title="Convert to PO"', 'title={t.purchaseQuotations.convertToPo}'],
  ['>Purchase Quotations (RFQ)</h1>', '>{t.purchaseQuotations.title}</h1>'],
  ['Request price quotes from suppliers', '{t.purchaseQuotations.subtitle}'],
  ['>New RFQ</button>', '>{t.purchaseQuotations.newRfq}</button>'],
  ['title="Purchase Quotations"', 'title={t.purchaseQuotations.tableTitle}'],
  ['emptyMessage="No purchase quotations found"', 'emptyMessage={t.purchaseQuotations.emptyMessage}'],
  ['searchPlaceholder="Search by RFQ #, supplier, status..."', 'searchPlaceholder={t.purchaseQuotations.searchPlaceholder}'],
  ['>Purchase Returns</h1>', '>{t.purchaseReturns.title}</h1>'],
  ['Track supplier returns and start new returns from original purchase receipts', '{t.purchaseReturns.subtitle}'],
  ['>New Return</button>', '>{t.purchaseReturns.newReturn}</button>'],
  ['title="Purchase Returns"', 'title={t.purchaseReturns.tableTitle}'],
  ['emptyMessage="No purchase returns recorded yet"', 'emptyMessage={t.purchaseReturns.emptyMessage}'],
  ['searchPlaceholder="Search by return #, source purchase, or supplier..."', 'searchPlaceholder={t.purchaseReturns.searchPlaceholder}'],
  ['title="Create another return from this purchase"', 'title={t.purchaseReturns.createAnother}'],
  ["{ label: 'Draft', filters:", '{ label: t.purchaseShared.status.DRAFT, filters:'],
  ["{ label: 'Sent', filters:", '{ label: t.purchaseShared.status.SENT, filters:'],
  ["{ label: 'Received', filters:", '{ label: t.purchaseShared.status.RECEIVED, filters:'],
  ["{ label: 'Accepted', filters:", '{ label: t.purchaseShared.status.ACCEPTED, filters:'],
  ["{ label: 'Converted', filters:", '{ label: t.purchaseShared.status.CONVERTED, filters:'],
  ["setError('Add at least one purchased product.')", 'setError(t.purchaseShared.addOnePurchasedProduct)'],
  ["setError('Supplier name is required when creating a supplier inline.')", 'setError(t.purchaseShared.supplierNameRequiredInline)'],
  ["setError(submitError.message || 'Failed to record purchase')", 'setError(submitError.message || t.purchaseShared.failedRecordPurchase)'],
  ['>Record Purchase</h2>', '>{t.purchases.modal.title}</h2>'],
  ['Receive stock, capture supplier, and update inventory', '{t.purchases.modal.subtitle}'],
  ['placeholder="Search products by name or SKU..."', 'placeholder={t.purchaseShared.searchProducts}'],
  ['>Product</th>', '>{t.common.product}</th>'],
  ['>Qty</th>', '>{t.purchaseShared.qty}</th>'],
  ['>Unit Cost</th>', '>{t.purchaseShared.unitCost}</th>'],
  ['>Line Total</th>', '>{t.purchaseShared.lineTotal}</th>'],
  ['>Supplier</h3>', '>{t.common.supplier}</h3>'],
  ['Link existing or create inline', '{t.purchaseShared.linkOrCreateSupplier}'],
  ["{createInlineSupplier ? 'Use Existing' : 'New Supplier'}", '{createInlineSupplier ? t.purchaseShared.useExisting : t.purchaseShared.newSupplier}'],
  ['>No supplier selected</option>', '>{t.purchaseShared.noSupplier}</option>'],
  ['placeholder="Supplier name"', 'placeholder={t.purchaseShared.supplierNamePlaceholder}'],
  ['placeholder="Phone"', 'placeholder={t.common.phone}'],
  ['placeholder="Email"', 'placeholder={t.common.email}'],
  ['placeholder="Address"', 'placeholder={t.common.address}'],
  ['>Cost Adjustments</h3>', '>{t.purchaseShared.costAdjustments}</h3>'],
  ['>Tax</label>', '>{t.common.tax}</label>'],
  ['>Discount</label>', '>{t.common.discount}</label>'],
  ['>Freight</label>', '>{t.purchaseShared.freight}</label>'],
  ['placeholder="Purchase notes"', 'placeholder={t.purchaseShared.purchaseNotes}'],
  ['>Subtotal</span>', '>{t.common.subtotal}</span>'],
  ['>Tax</span>', '>{t.common.tax}</span>'],
  ['>Freight</span>', '>{t.purchaseShared.freight}</span>'],
  ['>Discount</span>', '>{t.common.discount}</span>'],
  ['>Purchase Total</span>', '>{t.purchaseShared.purchaseTotal}</span>'],
  ["{loading ? 'Saving...' : 'Post Purchase'}", '{loading ? t.purchases.modal.saving : t.purchases.modal.postPurchase}'],
  ['>Cancel</button>', '>{t.common.cancel}</button>'],
  ['Purchase Order', '{t.purchases.invoice.purchaseReceipt}'],
  ['>Buyer</div>', '>{t.purchases.invoice.buyer}</div>'],
  ['>Supplier</div>', '>{t.common.supplier}</div>'],
  ['>No supplier linked</div>', '>{t.purchases.invoice.noSupplier}</div>'],
  ['>Purchase No.</div>', '>{t.purchases.invoice.purchaseNo}</div>'],
  ['>Date</div>', '>{t.common.date}</div>'],
  ['>Branch</div>', '>{t.common.branch}</div>'],
  ['>Description</th>', '>{t.purchases.invoice.description}</th>'],
  ['>SKU</th>', '>{t.purchases.invoice.sku}</th>'],
  ['>Qty</th>', '>{t.purchases.invoice.qty}</th>'],
  ['>Unit Cost</th>', '>{t.purchases.invoice.unitCost}</th>'],
  ['>Line Total</th>', '>{t.purchases.invoice.lineTotal}</th>'],
  ["?? 'Unknown Product'", '?? t.purchases.invoice.unknownProduct'],
  ['>Subtotal</span>', '>{t.purchases.invoice.subtotal}</span>'],
  ['>Total</span>', '>{t.purchases.invoice.total}</span>'],
  ['<span className="font-semibold">Note: </span>', '<span className="font-semibold">{t.purchases.invoice.notePrefix} </span>'],
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
for (const d of dirs) {
  const dir = path.join(root, d);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
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
}
console.log('changed', changed);