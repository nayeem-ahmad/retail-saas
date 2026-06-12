#!/usr/bin/env node
/**
 * Adds useI18n import and hook to purchase/accounting dashboard files.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src/app/dashboard');

const TARGETS = [
  'purchases/page.tsx',
  'purchases/CreatePurchaseModal.tsx',
  'purchases/[id]/invoice/page.tsx',
  'purchases/reports/summary/page.tsx',
  'purchases/reports/by-product/page.tsx',
  'purchases/reports/by-supplier/page.tsx',
  'suppliers/page.tsx',
  'purchase-orders/page.tsx',
  'purchase-orders/CreatePurchaseOrderModal.tsx',
  'purchase-orders/[id]/page.tsx',
  'purchase-orders/[id]/invoice/page.tsx',
  'purchase-quotations/page.tsx',
  'purchase-quotations/CreatePurchaseQuotationModal.tsx',
  'purchase-quotations/[id]/page.tsx',
  'purchase-returns/page.tsx',
  'purchase-returns/CreatePurchaseReturnModal.tsx',
  'purchase-returns/[id]/page.tsx',
  'accounting/page.tsx',
  'accounting/coa/page.tsx',
  'accounting/ledger/page.tsx',
  'accounting/journal/page.tsx',
  'accounting/journal/[id]/page.tsx',
  'accounting/vouchers/page.tsx',
  'accounting/posting-rules/page.tsx',
  'accounting/reconciliation/page.tsx',
  'accounting/reconciliation/bank/page.tsx',
  'accounting/recurring-journals/page.tsx',
  'accounting/fixed-assets/page.tsx',
  'accounting/fiscal-periods/page.tsx',
  'accounting/opening-balances/page.tsx',
  'accounting/cost-centers/page.tsx',
  'accounting/reports/pl/page.tsx',
  'accounting/reports/balance-sheet/page.tsx',
  'accounting/reports/cashbook/page.tsx',
  'accounting/reports/bankbook/page.tsx',
  'accounting/reports/trial-balance/page.tsx',
  'accounting/reports/comparative-pl/page.tsx',
  'accounting/reports/ar-aging/page.tsx',
  'accounting/reports/ap-aging/page.tsx',
  'accounting/reports/vat-tax/page.tsx',
  'accounting/reports/budget-vs-actual/page.tsx',
  'accounting/reports/cash-flow/page.tsx',
  'accounting/reports/financial-ratios/page.tsx',
];

function resolveI18nImport(filePath) {
  const depth = filePath.split('/').length - 1;
  if (depth <= 2) return "@/lib/i18n";
  return '../'.repeat(depth - 2) + 'lib/i18n';
}

function addI18nHook(content, componentName) {
  const hookLine = '    const { t, locale } = useI18n();';
  const patterns = [
    new RegExp(`(export default function ${componentName}\\(\\) \\{\\n)`),
    new RegExp(`(function ${componentName}\\(\\) \\{\\n)`),
  ];
  for (const pattern of patterns) {
    if (pattern.test(content) && !content.includes('useI18n()')) {
      return content.replace(pattern, `$1${hookLine}\n`);
    }
  }
  return content;
}

function processFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn('SKIP missing:', relPath);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('useI18n')) {
    console.log('SKIP already migrated:', relPath);
    return;
  }

  const i18nImport = resolveI18nImport(relPath);

  // Add import after last import line
  if (!content.includes("from '@/lib/i18n'") && !content.includes('from \'../../../lib/i18n\'') && !content.includes('useI18n')) {
    const importLine = `import { useI18n, formatMessage } from '${i18nImport.replace(/\\/g, '/')}';`;
    const lastImportMatch = content.match(/^import .+$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      content = content.replace(lastImport, `${lastImport}\n${importLine}`);
    }
  }

  // Inject hook into default export function
  const defaultFn = content.match(/export default function (\w+)/);
  if (defaultFn) {
    content = addI18nHook(content, defaultFn[1]);
  }

  // Also handle inner content functions like AccountingLedgerPageContent
  const innerFns = [...content.matchAll(/function (\w+PageContent)\(\)/g)];
  for (const [, name] of innerFns) {
    content = addI18nHook(content, name);
  }

  // Pass locale to formatters
  content = content
    .replace(/formatBDT\(([^)]+)\)/g, (match, args) => {
      if (args.includes('locale')) return match;
      return `formatBDT(${args}, { locale })`;
    })
    .replace(/formatDate\(([^)]+)\)/g, (match, args) => {
      if (args.includes('locale')) return match;
      return `formatDate(${args}, locale)`;
    });

  fs.writeFileSync(fullPath, content);
  console.log('MIGRATED scaffold:', relPath);
}

for (const target of TARGETS) {
  processFile(target);
}