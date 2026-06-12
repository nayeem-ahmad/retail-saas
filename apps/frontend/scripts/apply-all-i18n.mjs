#!/usr/bin/env node
/**
 * Bulk-apply i18n string replacements across purchase & accounting dashboard files.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve('src/app/dashboard');

// Global replacements safe across many files
const globalReplacements = [
  ['>Cancel<', '>{t.common.cancel}<'],
  ['>Delete<', '>{t.common.delete}<'],
  ['>Save Changes<', '>{t.common.saveChanges}<'],
  ['>Create<', '>{t.common.create}<'],
  ['>From<', '>{t.common.from}<'],
  ['>To<', '>{t.common.to}<'],
  ["header: 'Actions'", "header: t.common.actions"],
  ["header: 'Status'", "header: t.common.status"],
  ["header: 'Total'", "header: t.common.total"],
  ["header: 'Date'", "header: t.common.date"],
  ["header: 'Supplier'", "header: t.common.supplier"],
  ["header: 'Product'", "header: t.common.product"],
  ["header: 'Phone'", "header: t.common.phone"],
  ["header: 'Email'", "header: t.common.email"],
  ["header: 'Address'", "header: t.common.address"],
  ["header: 'Items'", "header: t.purchases.columns.items"],
  ["header: 'Qty'", "header: t.shared.qty"],
  ["header: 'SKU'", "header: t.common.sku"],
  ['text-[10px] font-black uppercase tracking-widest text-gray-400">From</span>', 'text-[10px] font-black uppercase tracking-widest text-gray-400">{t.common.from}</span>'],
  ['text-[10px] font-black uppercase tracking-widest text-gray-400">To</span>', 'text-[10px] font-black uppercase tracking-widest text-gray-400">{t.common.to}</span>'],
  ['>Loading…<', '>{t.common.loading}<'],
  ['>Loading...<', '>{t.common.loadingShort}<'],
  ['useMemo(\n        () =>', 'useMemo(\n        () =>'],
  ['],\n        [],', '],\n        [t, locale],'],
  ['],\n    [],', '],\n    [t, locale],'],
  ['],\n        [rfqs]', '],\n        [t, locale, rfqs]'],
];

const dirs = [
  'purchases', 'suppliers', 'purchase-orders', 'purchase-quotations', 'purchase-returns', 'accounting',
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.tsx') && !e.name.endsWith('.test.tsx')) files.push(p);
  }
}

const files = [];
for (const d of dirs) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full);
}

let changed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useI18n')) continue;
  const original = content;
  for (const [from, to] of globalReplacements) {
    if (content.includes(from) && !content.includes(to)) {
      content = content.replaceAll(from, to);
    }
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
    console.log('Updated:', path.relative(ROOT, file));
  }
}
console.log(`Done. ${changed} files updated.`);