#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src/app/dashboard');

const fileReplacements = {
  'purchases/page.tsx': [
    ["header: 'Purchase #'", "header: t.purchases.columns.purchaseNumber"],
    ["?? 'Unlinked'", "?? t.shared.unlinked"],
    ["header: 'Supplier'", "header: t.purchases.columns.supplier"],
    ["header: 'Items'", "header: t.purchases.columns.items"],
    ["{info.getValue()} items", "formatMessage(t.shared.itemsCount, { count: info.getValue() })"],
    ["header: 'Products'", "header: t.purchases.columns.products"],
    ["header: 'Total'", "header: t.purchases.columns.total"],
    ["header: 'Received'", "header: t.purchases.columns.received"],
    ["header: 'Voucher'", "header: t.purchases.columns.voucher"],
    ["title=\"Print Invoice\"", "title={t.purchases.printInvoice}"],
    ['>Purchases<', '>{t.purchases.title}<'],
    ['Record stock receipts and supplier-linked procurement activity', '{t.purchases.subtitle}'],
    ['>Record Purchase<', '>{t.purchases.recordPurchase}<'],
    ['title="Purchases"', 'title={t.purchases.tableTitle}'],
    ['emptyMessage="No purchases recorded yet"', 'emptyMessage={t.purchases.emptyMessage}'],
    ['searchPlaceholder="Search by purchase #, supplier, or product..."', 'searchPlaceholder={t.purchases.searchPlaceholder}'],
    ['],\n        [],', '],\n        [t, locale],'],
  ],
  'suppliers/page.tsx': [
    ["header: 'Supplier'", "header: t.suppliers.columns.supplier"],
    ["header: 'Phone'", "header: t.suppliers.columns.phone"],
    ["header: 'Email'", "header: t.suppliers.columns.email"],
    ["header: 'Address'", "header: t.suppliers.columns.address"],
    ["header: 'Added'", "header: t.suppliers.columns.added"],
    ["header: 'Actions'", "header: t.suppliers.columns.actions"],
    ["title=\"Edit\"", "title={t.common.edit}"],
    ["title=\"Delete\"", "title={t.common.delete}"],
    ['>Suppliers<', '>{t.suppliers.title}<'],
    ['Manage your supplier directory', '{t.suppliers.subtitle}'],
    ['>New Supplier<', '>{t.suppliers.newSupplier}<'],
    ['title="Suppliers"', 'title={t.suppliers.tableTitle}'],
    ['emptyMessage="No suppliers yet. Add your first supplier."', 'emptyMessage={t.suppliers.emptyMessage}'],
    ['searchPlaceholder="Search by name, phone, or email..."', 'searchPlaceholder={t.suppliers.searchPlaceholder}'],
    ["? 'Edit Supplier' : 'New Supplier'", "? t.suppliers.editSupplier : t.suppliers.newSupplier"],
    ["setError('Supplier name is required.');", "setError(t.suppliers.nameRequired);"],
    ["err.message || 'Failed to save supplier.'", "err.message || t.suppliers.saveFailed"],
    ["placeholder=\"Supplier name\"", "placeholder={t.shared.supplierNamePlaceholder}"],
    ['>Phone<', '>{t.common.phone}<'],
    ['>Email<', '>{t.common.email}<'],
    ['>Address<', '>{t.common.address}<'],
    ["placeholder=\"Street address\"", "placeholder={t.shared.addressPlaceholder}"],
    ['>Cancel<', '>{t.common.cancel}<'],
    ["? 'Saving...' : editTarget ? 'Save Changes' : 'Create'", "? t.suppliers.saving : editTarget ? t.common.saveChanges : t.common.create"],
    ['>Delete Supplier?<', '>{t.suppliers.deleteTitle}<'],
    ['This supplier will be removed from your directory. Existing purchases linked to them will not be affected.', '{t.suppliers.deleteDescription}'],
    ['>Delete<', '>{t.common.delete}<'],
    ['],\n        [],', '],\n        [t, locale],'],
  ],
};

for (const [rel, replacements] of Object.entries(fileReplacements)) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  let content = fs.readFileSync(full, 'utf8');
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
    }
  }
  fs.writeFileSync(full, content);
  console.log('Applied strings:', rel);
}