#!/usr/bin/env node
/**
 * Migrate catalog-module pages to useI18n.
 * Run: node scripts/migrate-catalog-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../src');

function ensureUseI18n(content, extraImports = '') {
    if (content.includes('useI18n')) return content;
    let next = content;
    if (!next.includes("'use client'") && !next.includes('"use client"')) {
        next = `'use client';\n\n${next}`;
    }
    const importLine = extraImports
        ? `import { useI18n, formatMessage } from '@/lib/i18n';\n${extraImports}\n`
        : `import { useI18n, formatMessage } from '@/lib/i18n';\n`;
    if (next.includes("from '@/lib/i18n'")) return next;
    const lines = next.split('\n');
    let insertAt = 0;
    if (lines[0]?.includes('use client')) insertAt = 2;
    lines.splice(insertAt, 0, importLine.trim());
    return lines.join('\n');
}

function apply(fileRel, transforms) {
    const full = path.join(SRC, fileRel);
    if (!fs.existsSync(full)) {
        console.warn('SKIP (missing):', fileRel);
        return;
    }
    let content = fs.readFileSync(full, 'utf8');
    const original = content;
    for (const [from, to] of transforms) {
        if (typeof from === 'string') {
            if (content.includes(from)) content = content.split(from).join(to);
        } else if (from instanceof RegExp) {
            content = content.replace(from, to);
        }
    }
    if (content !== original) {
        fs.writeFileSync(full, content);
        console.log('Updated:', fileRel);
    }
}

// --- FeedbackWidget ---
apply('components/FeedbackWidget.tsx', [
    [() => ensureUseI18n, null],
]);
let fw = fs.readFileSync(path.join(SRC, 'components/FeedbackWidget.tsx'), 'utf8');
if (!fw.includes('const { t }')) {
    fw = ensureUseI18n(fw);
    fw = fw.replace(
        'export default function FeedbackWidget() {',
        'export default function FeedbackWidget() {\n    const { t } = useI18n();\n    const m = t.components.feedbackWidget;',
    );
    fw = fw.replace(
        `const TYPE_OPTIONS: { value: FeedbackType; label: string; emoji: string }[] = [
    { value: 'bug', label: 'Bug', emoji: '🐛' },
    { value: 'feature', label: 'Feature', emoji: '✨' },
    { value: 'general', label: 'General', emoji: '💬' },
];`,
        `const TYPE_EMOJI: Record<FeedbackType, string> = { bug: '🐛', feature: '✨', general: '💬' };
    const TYPE_OPTIONS: { value: FeedbackType; label: string; emoji: string }[] = [
        { value: 'bug', label: m.types.bug, emoji: TYPE_EMOJI.bug },
        { value: 'feature', label: m.types.feature, emoji: TYPE_EMOJI.feature },
        { value: 'general', label: m.types.general, emoji: TYPE_EMOJI.general },
    ];`,
    );
    fw = fw.replace(`err?.message || 'Something went wrong. Please try again.'`, `err?.message || m.defaultError`);
    fw = fw.replace(`<p className="text-sm font-semibold text-gray-800">Thanks for your feedback!</p>`, `<p className="text-sm font-semibold text-gray-800">{m.successTitle}</p>`);
    fw = fw.replace(`<p className="text-xs text-gray-400">This window will close shortly.</p>`, `<p className="text-xs text-gray-400">{m.successDescription}</p>`);
    fw = fw.replace(`<p className="text-sm font-bold text-gray-800">Send feedback</p>`, `<p className="text-sm font-bold text-gray-800">{m.title}</p>`);
    fw = fw.replace(`aria-label="Close"`, `aria-label={m.closeAria}`);
    fw = fw.replace(`placeholder="Describe your feedback..."`, `placeholder={m.placeholder}`);
    fw = fw.replace(`>Cancel<`, `>{m.cancel}<`);
    fw = fw.replace(`{status === 'submitting' ? 'Sending…' : 'Submit'}`, `{status === 'submitting' ? m.submitting : m.submit}`);
    fw = fw.replace(`aria-label="Open feedback"`, `aria-label={m.openAria}`);
    fw = fw.replace(`\n                Feedback\n            </button>`, `\n                {m.button}\n            </button>`);
    fs.writeFileSync(path.join(SRC, 'components/FeedbackWidget.tsx'), fw);
    console.log('Updated: components/FeedbackWidget.tsx');
}

// --- Admin tenants ---
let tenants = fs.readFileSync(path.join(SRC, 'app/dashboard/admin/tenants/page.tsx'), 'utf8');
if (!tenants.includes('useI18n')) {
    tenants = ensureUseI18n(tenants.replace("from '../../../../lib/api'", "from '@/lib/api'").replace("from '../../../../lib/format'", "from '@/lib/format'"));
    tenants = tenants.replace(
        'export default function AdminTenantsPage() {',
        `import { useI18n, formatMessage } from '@/lib/i18n';\n\nexport default function AdminTenantsPage() {\n    const { t, formatMessage: fmt } = useI18n();\n    const m = t.admin.tenants;`,
    );
    // fix duplicate import
    tenants = tenants.replace(/import \{ useI18n, formatMessage \} from '@\/lib\/i18n';\n\nimport \{ useI18n, formatMessage \}/, 'import { useI18n, formatMessage }');
    tenants = tenants.replace("'Failed to load tenants.'", 'm.loadFailed');
    tenants = tenants.replace("'Failed to load tenant detail.'", 'm.loadDetailFailed');
    tenants = tenants.replace("'Failed to update tenant subscription.'", 'm.updateSubscriptionFailed');
    tenants = tenants.replace(
        /if \(!window\.confirm\(`Suspend "\$\{selectedTenant\.name\}"\? This sets their subscription to CANCELLED and blocks access\.`\)\) return;/,
        'if (!window.confirm(fmt(m.suspendConfirm, { name: selectedTenant.name }))) return;',
    );
    tenants = tenants.replace('showToast(`${selectedTenant.name} has been suspended.`);', 'showToast(fmt(m.suspendedToast, { name: selectedTenant.name }));');
    tenants = tenants.replace("'Failed to suspend tenant.'", 'm.suspendFailed');
    tenants = tenants.replace(
        'showToast(`Now impersonating ${res.impersonated_user.email} · token expires in 1 hour`);',
        'showToast(fmt(m.impersonateToast, { email: res.impersonated_user.email }));',
    );
    tenants = tenants.replace("'Failed to impersonate tenant.'", 'm.impersonateFailed');
    tenants = tenants.replace('>Tenant Management<', '>{m.title}<');
    tenants = tenants.replace('Platform-admin oversight for subscription health, owner assignment, and workspace footprint', '{m.subtitle}');
    tenants = tenants.replace('placeholder="Search by tenant or owner"', 'placeholder={m.searchPlaceholder}');
    tenants = tenants.replace('>All plans<', '>{m.allPlans}<');
    tenants = tenants.replace('>Free<', '>{m.plans.free}<');
    tenants = tenants.replace('>Basic<', '>{m.plans.basic}<');
    tenants = tenants.replace('>Standard<', '>{m.plans.standard}<');
    tenants = tenants.replace('>Premium<', '>{m.plans.premium}<');
    tenants = tenants.replace('>All statuses<', '>{m.allStatuses}<');
    tenants = tenants.replace('>Active<', '>{m.statuses.active}<');
    tenants = tenants.replace('>Trialing<', '>{m.statuses.trialing}<');
    tenants = tenants.replace('>Past due<', '>{m.statuses.pastDue}<');
    tenants = tenants.replace('>Cancelled<', '>{m.statuses.cancelled}<');
    tenants = tenants.replace('Loading tenants...', '{m.loading}');
    tenants = tenants.replace('No tenants matched these filters.', '{m.noResults}');
    tenants = tenants.replace("'No owner assigned'", 'm.noOwner');
    tenants = tenants.replace("'UNASSIGNED'", 'm.unassigned');
    tenants = tenants.replace('{tenant.store_count} stores', '{fmt(m.storesCount, { count: tenant.store_count })}');
    tenants = tenants.replace('{tenant.user_count} users', '{fmt(m.usersCount, { count: tenant.user_count })}');
    tenants = tenants.replace('>Selected Tenant<', '>{m.selectedTenant}<');
    tenants = tenants.replace('Created {formatDate(selectedTenant.created_at)}', '{fmt(m.created, { date: formatDate(selectedTenant.created_at) })}');
    tenants = tenants.replace('>Owner<', '>{m.owner}<');
    tenants = tenants.replace("'Unknown owner'", 'm.unknownOwner');
    tenants = tenants.replace("'No owner email'", 'm.noOwnerEmail');
    tenants = tenants.replace('Impersonate Owner', '{m.impersonateOwner}');
    tenants = tenants.replace("'Already Suspended'", 'm.alreadySuspended');
    tenants = tenants.replace('Suspend Tenant', '{m.suspendTenant}');
    tenants = tenants.replace('label="Stores"', 'label={m.infoCards.stores}');
    tenants = tenants.replace('label="Users"', 'label={m.infoCards.users}');
    tenants = tenants.replace('label="Provider"', 'label={m.infoCards.provider}');
    tenants = tenants.replace('>Subscription Controls<', '>{m.subscriptionControls.badge}<');
    tenants = tenants.replace('>Adjust plan and status<', '>{m.subscriptionControls.title}<');
    tenants = tenants.replace('>Cancel at period end<', '>{m.subscriptionControls.cancelAtPeriodEnd}<');
    tenants = tenants.replace('Save Subscription', '{m.subscriptionControls.save}');
    tenants = tenants.replace('>Stores<', '>{m.storesSection}<');
    tenants = tenants.replace('>Users<', '>{m.usersSection}<');
    tenants = tenants.replace("'No address recorded'", 'm.noAddress');
    tenants = tenants.replace('Select a tenant to inspect and update subscription settings.', '{m.selectPrompt}');
    fs.writeFileSync(path.join(SRC, 'app/dashboard/admin/tenants/page.tsx'), tenants);
    console.log('Updated: app/dashboard/admin/tenants/page.tsx');
}

// --- Admin users ---
let users = fs.readFileSync(path.join(SRC, 'app/dashboard/admin/users/page.tsx'), 'utf8');
if (!users.includes('useI18n')) {
    users = ensureUseI18n(users);
    users = users.replace(
        'export default function AdminUsersPage() {',
        'export default function AdminUsersPage() {\n    const { t, formatMessage: fmt } = useI18n();\n    const m = t.admin.users;',
    );
    users = users.replace("'Failed to load users'", 'm.loadFailed');
    users = users.replace('showToast(`${user.email} removed as platform admin`);', 'showToast(fmt(m.removedAdmin, { email: user.email }));');
    users = users.replace('showToast(`${user.email} granted platform admin`);', 'showToast(fmt(m.grantedAdmin, { email: user.email }));');
    users = users.replace("'Action failed'", 'm.actionFailed');
    users = users.replace('>User Management<', '>{m.title}<');
    users = users.replace(
        'Grant or revoke platform admin access · {total} users total',
        '{fmt(m.subtitle, { total })}',
    );
    users = users.replace('placeholder="Search by name or email…"', 'placeholder={m.searchPlaceholder}');
    users = users.replace('Loading users…', '{m.loading}');
    users = users.replace('No users found.', '{m.noUsers}');
    users = users.replace(
        /\{user\.tenant_count\} tenant\{user\.tenant_count !== 1 \? 's' : ''\}/,
        '{user.tenant_count === 1 ? fmt(m.tenantCount, { count: user.tenant_count }) : fmt(m.tenantCountPlural, { count: user.tenant_count })}',
    );
    users = users.replace('> Admin</span>', '> {m.adminBadge}</span>');
    users = users.replace("'Revoke Admin'", 'm.revokeAdmin');
    users = users.replace("'Make Admin'", 'm.makeAdmin');
    fs.writeFileSync(path.join(SRC, 'app/dashboard/admin/users/page.tsx'), users);
    console.log('Updated: app/dashboard/admin/users/page.tsx');
}

console.log('Migration script complete.');