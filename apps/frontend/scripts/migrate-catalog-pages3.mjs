#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../src');

function read(rel) {
    return fs.readFileSync(path.join(SRC, rel), 'utf8');
}
function write(rel, content) {
    fs.writeFileSync(path.join(SRC, rel), content);
    console.log('Updated:', rel);
}

function injectHook(content, hookLine, componentName) {
    if (content.includes('useI18n')) return content;
    if (!content.includes("'use client'")) content = `'use client';\n\n${content}`;
    if (!content.includes("from '@/lib/i18n'")) {
        const idx = content.indexOf('\n', content.startsWith("'use client'") ? 12 : 0);
        content = content.slice(0, idx + 1) + `import { useI18n, formatMessage } from '@/lib/i18n';\n` + content.slice(idx + 1);
    }
    const re = new RegExp(`(export default function ${componentName}\\([^)]*\\) \\{)`);
    if (re.test(content)) {
        content = content.replace(re, `$1\n    ${hookLine}`);
    }
    return content;
}

function replaceAll(content, pairs) {
    let c = content;
    for (const [from, to] of pairs) {
        if (typeof from === 'string') c = c.split(from).join(to);
        else c = c.replace(from, to);
    }
    return c;
}

// --- Discount codes ---
{
    let c = read('app/dashboard/settings/discount-codes/page.tsx');
    c = injectHook(c, 'const { t, formatMessage: fmt } = useI18n();\n    const m = t.settingsExtras.discountCodes;', 'DiscountCodesPage');
    c = replaceAll(c, [
        ["setError('Failed to load discount codes')", 'setError(m.loadFailed)'],
        ["setSuccess('Discount code created')", 'setSuccess(m.created)'],
        ["err?.message ?? 'Failed to create code'", 'err?.message ?? m.createFailed'],
        ["setError('Failed to update code')", 'setError(m.updateFailed)'],
        ['if (!confirm(`Delete code "${code}"?`)) return;', 'if (!confirm(fmt(m.deleteConfirm, { code }))) return;'],
        ["setError('Failed to delete code')", 'setError(m.deleteFailed)'],
        ['>Discount Codes<', '>{m.title}<'],
        ['New Code', '{m.newCode}'],
        ['Create discount codes for promotions, Eid sales, bulk buyers, and loyal customers.\n                Codes can be applied at the POS checkout screen.', '{m.infoBanner}'],
        ['>New Discount Code<', '>{m.form.title}<'],
        ['>Code *<', '>{m.form.code}<'],
        ['placeholder="e.g. EID2025"', 'placeholder={m.form.codePlaceholder}'],
        ['>Name *<', '>{m.form.name}<'],
        ['placeholder="e.g. Eid Special 2025"', 'placeholder={m.form.namePlaceholder}'],
        ['>Type *<', '>{m.form.type}<'],
        ['>Percentage (%)<', '>{m.form.percentage}<'],
        ['>Fixed Amount (৳)<', '>{m.form.fixed}<'],
        ['>Value * {form.type === \'PERCENTAGE\' ? \'(%)\' : \'(৳)\'}<', '>{m.form.value} {form.type === \'PERCENTAGE\' ? m.form.valuePercent : m.form.valueAmount}<'],
        ['>Min Purchase (৳)<', '>{m.form.minPurchase}<'],
        ['placeholder="e.g. 500"', 'placeholder={m.form.minPurchasePlaceholder}'],
        ['>Max Discount (৳)<', '>{m.form.maxDiscount}<'],
        ['placeholder="e.g. 1000"', 'placeholder={m.form.maxDiscountPlaceholder}'],
        ['>Usage Limit<', '>{m.form.usageLimit}<'],
        ['placeholder="Unlimited"', 'placeholder={m.form.usageLimitPlaceholder}'],
        ['>Valid From<', '>{m.form.validFrom}<'],
        ['>Valid Until<', '>{m.form.validUntil}<'],
        ['>Cancel<', '>{m.form.cancel}<'],
        ["{saving ? 'Creating…' : 'Create Code'}", "{saving ? m.form.creating : m.form.create}"],
        ['Loading…', '{m.loading}'],
        ['>No discount codes yet<', '>{m.emptyTitle}<'],
        ['Create your first code to start offering promotions', '{m.emptyDescription}'],
        ['>Code<', '>{m.table.code}<'],
        ['>Discount<', '>{m.table.discount}<'],
        ['>Conditions<', '>{m.table.conditions}<'],
        ['>Usage<', '>{m.table.usage}<'],
        ['>Validity<', '>{m.table.validity}<'],
        ['>Status<', '>{m.table.status}<'],
        ['`Min ${formatBDT(parseFloat(c.min_purchase))}`', 'fmt(m.table.minPrefix, {}) + ` ${formatBDT(parseFloat(c.min_purchase))}`'],
        ['max {formatBDT(parseFloat(c.max_discount))}', '{m.table.maxPrefix} {formatBDT(parseFloat(c.max_discount))}'],
        ['<>Until {new Date(c.valid_until).toLocaleDateString(\'en-BD\')}</>', '<>{m.table.until} {new Date(c.valid_until).toLocaleDateString(\'en-BD\')}</>'],
        ['No expiry', '{m.table.noExpiry}'],
        ['>Active<', '>{m.table.active}<'],
        ['>Inactive<', '>{m.table.inactive}<'],
    ]);
    write('app/dashboard/settings/discount-codes/page.tsx', c);
}

// --- Tax ---
{
    let c = read('app/dashboard/settings/tax/page.tsx');
    c = injectHook(c, 'const { t } = useI18n();\n    const m = t.settingsExtras.tax;', 'TaxSettingsPage');
    c = replaceAll(c, [
        [".catch(() => setError('Failed to load tax settings'))", '.catch(() => setError(m.loadFailed))'],
        ["setError('VAT rate must be a number between 0 and 100')", 'setError(m.vatRateInvalid)'],
        ["e.message ?? 'Failed to save'", 'e.message ?? m.saveFailed'],
        ['>Tax Settings<', '>{m.title}<'],
        ['<strong>Bangladesh NBR Compliance</strong> — Configure your VAT registration and default rate.\n                The standard VAT rate is 15% under the VAT and Supplementary Duty Act 2012. Your VAT\n                registration number and BIN (Business Identification Number / TIN) will appear on all\n                customer invoices and receipts.', '<strong>{m.complianceTitle}</strong> — {m.complianceBody}'],
        ['Loading…', '{m.loading}'],
        ['Default VAT Rate (%)', '{m.vatRate.label}'],
        ['placeholder="e.g. 15"', 'placeholder={m.vatRate.placeholder}'],
        ['Leave blank to disable VAT. Products can override this rate individually.', '{m.vatRate.hint}'],
        ['VAT Registration Number (BIN)', '{m.vatReg.label}'],
        ['placeholder="e.g. 000000000-0101"', 'placeholder={m.vatReg.placeholder}'],
        ['Your 13-digit BIN issued by the National Board of Revenue (NBR).', '{m.vatReg.hint}'],
        ['Tax Identification Number (TIN)', '{m.tin.label}'],
        ['placeholder="e.g. 123456789012"', 'placeholder={m.tin.placeholder}'],
        ['12-digit TIN issued by the Income Tax department.', '{m.tin.hint12Digit}'],
        ['Tax settings saved successfully.', '{m.savedSuccess}'],
        ["{saving ? 'Saving…' : 'Save Tax Settings'}", "{saving ? m.saving : m.saveButton}"],
        ['>NBR VAT Compliance Checklist<', '>{m.checklist.title}<'],
    ]);
    // Replace checklist items - use index-based approach in page directly
    const checklistItems = [
        'VAT rate shown on POS receipts (Mushak 6.3 format)',
        'Subtotal, VAT amount, and total displayed separately on invoices',
        'BIN/VAT registration number printed on every invoice',
        'Register for VAT at <strong>ibas++.gov.bd</strong> if you have annual turnover above BDT 30 lakh',
        'File monthly VAT returns (Mushak 9.1) through the NBR online portal',
    ];
    checklistItems.forEach((item, i) => {
        c = c.replace(`<span>${item}</span>`, `<span>{m.checklist.items[${i}]}</span>`);
        c = c.replace(`<span>Register for VAT at <strong>ibas++.gov.bd</strong> if you have annual turnover above BDT 30 lakh</span>`, `<span>{m.checklist.items[3]}</span>`);
    });
    write('app/dashboard/settings/tax/page.tsx', c);
}

// --- Loyalty ---
{
    let c = read('app/dashboard/settings/loyalty/page.tsx');
    c = injectHook(c, 'const { t, formatMessage: fmt } = useI18n();\n    const m = t.settingsExtras.loyalty;', 'LoyaltySettingsPage');
    c = replaceAll(c, [
        ["message: err?.message || 'Failed to load loyalty settings.'", 'message: err?.message || m.loadFailed'],
        ["message: 'Loyalty settings saved.'", 'message: m.saved'],
        ["message: err?.message || 'Failed to save settings.'", 'message: err?.message || m.saveFailed'],
        ['Settings', '{m.backToSettings}'],
        ['>Loyalty Program<', '>{m.title}<'],
        ['Configure points earn & redeem rates for your customers.', '{m.description}'],
        ['Loading settings…', '{m.loading}'],
        ['>Enable Loyalty Program<', '>{m.enableLabel}<'],
        ['Allow customers to earn and redeem points.', '{m.enableHint}'],
        ['>Rate Configuration<', '>{m.rateConfigTitle}<'],
        ['>Earn Rate<', '>{m.earnRate.label}<'],
        ['placeholder="e.g. 1.0"', 'placeholder={m.earnRate.placeholder}'],
        ['points per ৳1 spent', '{m.earnRate.suffix}'],
        ['e.g. 1.0 means a ৳100 sale earns 100 points', '{m.earnRate.hint}'],
        ['>Redemption Rate<', '>{m.redeemRate.label}<'],
        ['1 point =', '{m.redeemRate.prefix}'],
        ['placeholder="e.g. 0.01"', 'placeholder={m.redeemRate.placeholder}'],
        ['e.g. 0.01 means 100 points = ৳1.00 discount', '{m.redeemRate.hint}'],
        ['>Minimum Points to Redeem<', '>{m.minRedeem.label}<'],
        ['placeholder="e.g. 100"', 'placeholder={m.minRedeem.placeholder}'],
        ['>points<', '>{m.minRedeem.suffix}<'],
        ['Customers must have at least this many points to redeem', '{m.minRedeem.hint}'],
        ['>Example Calculation<', '>{m.example.title}<'],
        [
            /A ৳\{exampleSaleAmount\} sale earns\{' '\}\s*<span className="font-bold">\{examplePointsEarned\} points<\/span>\./,
            '{fmt(m.example.saleEarned, { amount: exampleSaleAmount, points: examplePointsEarned })}',
        ],
        [
            /\{examplePointsEarned\} points =\{' '\}\s*<span className="font-bold">৳\{exampleDiscount\.toFixed\(2\)\} discount<\/span>\./,
            '{fmt(m.example.redeemDiscount, { points: examplePointsEarned, discount: exampleDiscount.toFixed(2) })}',
        ],
        ["{saving ? 'Saving…' : 'Save Settings'}", "{saving ? m.saving : m.saveButton}"],
    ]);
    write('app/dashboard/settings/loyalty/page.tsx', c);
}

// --- SMS settings ---
{
    let c = read('app/dashboard/settings/sms/page.tsx');
    c = injectHook(c, 'const { t } = useI18n();\n    const m = t.settingsExtras.sms;', 'SmsSettingsPage');
    c = replaceAll(c, [
        [".catch(() => setError('Failed to load SMS settings.'))", '.catch(() => setError(m.loadFailed))'],
        ["e.message ?? 'Failed to save SMS settings.'", 'e.message ?? m.saveFailed'],
        ['>SMS Notifications<', '>{m.title}<'],
        ['<strong>Server configuration required</strong> — SMS delivery requires the following\n                    environment variables to be set on the server:', '<strong>{m.infoTitle}</strong> — {m.infoBody.split(\'SMS_API_URL\')[0]}'],
    ]);
    // Simpler sms info replacement
    c = c.replace(
        /<strong>Server configuration required<\/strong> — SMS delivery requires the following[\s\S]*?and other Bangladeshi SMS gateways\./,
        '<strong>{m.infoTitle}</strong> — {m.infoBody}',
    );
    c = replaceAll(c, [
        ['Loading…', '{m.loading}'],
        ['>Enable SMS Notifications<', '>{m.enable.label}<'],
        ['Master switch for all SMS notifications for this tenant.', '{m.enable.hint}'],
        ['>Send SMS receipt after each sale<', '>{m.onSale.label}<'],
        ['Sends the customer a purchase confirmation SMS after a completed sale.\n                                Requires the customer to have a phone number on file.', '{m.onSale.hint}'],
        ['>Send SMS for low stock alerts<', '>{m.onLowStock.label}<'],
        ['Sends the tenant owner an SMS when products fall below their reorder\n                                point during the daily stock check.', '{m.onLowStock.hint}'],
        ['SMS settings saved successfully.', '{m.saved}'],
        ["{saving ? 'Saving…' : 'Save SMS Settings'}", "{saving ? m.saving : m.saveButton}"],
    ]);
    write('app/dashboard/settings/sms/page.tsx', c);
}

// --- Report emails settings ---
{
    let c = read('app/dashboard/settings/reports/page.tsx');
    c = injectHook(c, 'const { t } = useI18n();\n    const m = t.settingsExtras.reportEmails;', 'ReportSettingsPage');
    c = replaceAll(c, [
        [".catch(() => setError('Failed to load report settings.'))", '.catch(() => setError(m.loadFailed))'],
        ["e.message ?? 'Failed to save report settings.'", 'e.message ?? m.saveFailed'],
        ['>Automated Reports<', '>{m.title}<'],
        [
            /<strong>Automated sales report emails<\/strong> — enable weekly or monthly reports to[\s\S]*?unless you specify an override below\./,
            '<strong>{m.infoTitle}</strong> — {m.infoBody}',
        ],
        ['Loading&hellip;', '{m.loading}'],
        ['>Enable Weekly Report<', '>{m.weekly.label}<'],
        ["Sent every Monday morning with last week&apos;s sales summary (Mon–Sun).", '{m.weekly.hint}'],
        ['>Enable Monthly Report<', '>{m.monthly.label}<'],
        ["Sent on the 1st of each month with the previous month&apos;s full sales summary.", '{m.monthly.hint}'],
        ['>Report Email Address<', '>{m.email.label}<'],
        ['(optional)', '{m.email.optional}'],
        ['placeholder="Leave blank to use your account email"', 'placeholder={m.email.placeholder}'],
        ['Send reports to this email instead of your account email. Useful for sending\n                            reports to a shared inbox or an accountant.', '{m.email.hint}'],
        ['Report settings saved successfully.', '{m.saved}'],
        ["{saving ? 'Saving…' : 'Save Report Settings'}", "{saving ? m.saving : m.saveButton}"],
    ]);
    write('app/dashboard/settings/reports/page.tsx', c);
}

console.log('migrate-catalog-pages3 part 1 complete');