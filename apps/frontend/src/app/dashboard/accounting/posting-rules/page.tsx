'use client';

import { useEffect, useState } from 'react';
import { Settings2, Check, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../../../lib/api';

const EVENT_TYPE_LABELS: Record<string, string> = {
    sale: 'Sale',
    sale_return: 'Sale Return',
    purchase: 'Purchase',
    purchase_return: 'Purchase Return',
    inventory_adjustment: 'Inventory Adjustment',
    fund_movement: 'Fund Movement',
};

const CONDITION_KEY_LABELS: Record<string, string> = {
    none: 'Default (no condition)',
    payment_mode: 'Payment Mode',
    reason_type: 'Reason Type',
    transfer_scope: 'Transfer Scope',
};

type PostingRule = {
    id: string;
    eventType: string;
    conditionKey: string;
    conditionValue: string | null;
    debitAccount: { id: string; name: string; code: string | null };
    creditAccount: { id: string; name: string; code: string | null };
    priority: number;
    isActive: boolean;
    updatedAt: string;
};

type Account = {
    id: string;
    name: string;
    code: string | null;
    type: string;
};

type EditState = {
    ruleId: string;
    debitAccountId: string;
    creditAccountId: string;
    isActive: boolean;
    priority: number;
};

const CONDITION_KEYS = ['none', 'payment_mode', 'reason_type', 'transfer_scope'] as const;

export default function PostingRulesPage() {
    const [rules, setRules] = useState<PostingRule[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [editState, setEditState] = useState<EditState | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        void load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const [rulesData, accountsData] = await Promise.all([
                api.getPostingRules(),
                api.getAccounts(),
            ]);
            setRules(rulesData.data ?? []);
            setAccounts(accountsData ?? []);
            // Default expand all groups
            const groups: Record<string, boolean> = {};
            for (const rule of (rulesData.data ?? [])) {
                groups[rule.eventType] = true;
            }
            setExpandedGroups(groups);
        } catch (err) {
            console.error('Failed to load posting rules', err);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (rule: PostingRule) => {
        setEditState({
            ruleId: rule.id,
            debitAccountId: rule.debitAccount.id,
            creditAccountId: rule.creditAccount.id,
            isActive: rule.isActive,
            priority: rule.priority,
        });
        setSaveError('');
    };

    const cancelEdit = () => {
        setEditState(null);
        setSaveError('');
    };

    const saveEdit = async () => {
        if (!editState) return;
        if (editState.debitAccountId === editState.creditAccountId) {
            setSaveError('Debit and credit accounts must be different.');
            return;
        }
        setSaving(true);
        setSaveError('');
        try {
            const rule = rules.find((r) => r.id === editState.ruleId);
            await api.updatePostingRule(editState.ruleId, {
                debitAccountId: editState.debitAccountId,
                creditAccountId: editState.creditAccountId,
                conditionKey: rule?.conditionKey ?? 'none',
                conditionValue: rule?.conditionValue ?? undefined,
                priority: editState.priority,
                isActive: editState.isActive,
            });
            await load();
            setEditState(null);
        } catch (err: any) {
            setSaveError(err.message ?? 'Failed to save posting rule.');
        } finally {
            setSaving(false);
        }
    };

    const toggleGroup = (eventType: string) => {
        setExpandedGroups((prev) => ({ ...prev, [eventType]: !prev[eventType] }));
    };

    // Group rules by event type
    const grouped = rules.reduce<Record<string, PostingRule[]>>((acc, rule) => {
        const key = rule.eventType;
        if (!acc[key]) acc[key] = [];
        acc[key].push(rule);
        return acc;
    }, {});

    const accountLabel = (acc: Account) =>
        acc.code ? `${acc.code} — ${acc.name}` : acc.name;

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1100px] mx-auto space-y-6">
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">
                        Accounting · Settings
                    </p>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <Settings2 className="w-5 h-5 text-indigo-700" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-gray-950">
                                    Posting Rules
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Configure which accounts are debited and credited for each operational event.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16 text-gray-400 text-sm">Loading posting rules…</div>
                ) : Object.keys(grouped).length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        No posting rules configured. Bootstrap the default Chart of Accounts to seed defaults.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([eventType, groupRules]) => (
                            <div key={eventType} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Group header */}
                                <button
                                    onClick={() => toggleGroup(eventType)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black uppercase tracking-wide text-gray-700">
                                            {EVENT_TYPE_LABELS[eventType] ?? eventType}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {groupRules.length} rule{groupRules.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {expandedGroups[eventType]
                                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>

                                {/* Rules */}
                                {expandedGroups[eventType] && (
                                    <div className="divide-y divide-gray-100">
                                        {groupRules.map((rule) => {
                                            const isEditing = editState?.ruleId === rule.id;
                                            return (
                                                <div key={rule.id} className="px-5 py-4">
                                                    {/* Condition label */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                            {CONDITION_KEY_LABELS[rule.conditionKey] ?? rule.conditionKey}
                                                        </span>
                                                        {rule.conditionValue && (
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                                {rule.conditionValue}
                                                            </span>
                                                        )}
                                                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold border ${rule.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                            {rule.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                                                        Debit Account
                                                                    </label>
                                                                    <select
                                                                        value={editState.debitAccountId}
                                                                        onChange={(e) => setEditState({ ...editState, debitAccountId: e.target.value })}
                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    >
                                                                        {accounts.map((acc) => (
                                                                            <option key={acc.id} value={acc.id}>
                                                                                {accountLabel(acc)}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                                                        Credit Account
                                                                    </label>
                                                                    <select
                                                                        value={editState.creditAccountId}
                                                                        onChange={(e) => setEditState({ ...editState, creditAccountId: e.target.value })}
                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    >
                                                                        {accounts.map((acc) => (
                                                                            <option key={acc.id} value={acc.id}>
                                                                                {accountLabel(acc)}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editState.isActive}
                                                                        onChange={(e) => setEditState({ ...editState, isActive: e.target.checked })}
                                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">Active</span>
                                                                </label>
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-sm text-gray-600">Priority</label>
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={1000}
                                                                        value={editState.priority}
                                                                        onChange={(e) => setEditState({ ...editState, priority: Number(e.target.value) })}
                                                                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {saveError && (
                                                                <p className="text-red-600 text-xs">{saveError}</p>
                                                            )}
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={saveEdit}
                                                                    disabled={saving}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    {saving ? 'Saving…' : 'Save'}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Debit</p>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {rule.debitAccount.code ? (
                                                                            <span className="font-mono text-xs text-gray-500 mr-1">{rule.debitAccount.code}</span>
                                                                        ) : null}
                                                                        {rule.debitAccount.name}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Credit</p>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {rule.creditAccount.code ? (
                                                                            <span className="font-mono text-xs text-gray-500 mr-1">{rule.creditAccount.code}</span>
                                                                        ) : null}
                                                                        {rule.creditAccount.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => startEdit(rule)}
                                                                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                                Edit
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
