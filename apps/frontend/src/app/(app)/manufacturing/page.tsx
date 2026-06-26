'use client';

import { useState, useEffect, useCallback } from 'react';
import { Factory, Plus, X, RefreshCw, Cog, Trash2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useI18n, formatMessage } from '@/lib/i18n';

// ------------------------------------------------------------------ //
//  Types                                                              //
// ------------------------------------------------------------------ //

interface BomComponent {
    id: string;
    productId: string;
    quantity: number;
    product: { id: string; name: string; sku: string | null };
}

interface BomRecipe {
    id: string;
    productId: string;
    productName: string;
    productSku: string | null;
    outputQty: number;
    notes: string | null;
    componentCount: number;
    created_at: string;
    updated_at: string;
}

interface BomRecipeDetail extends Omit<BomRecipe, 'componentCount'> {
    product: { id: string; name: string; sku: string | null };
    components: BomComponent[];
}

interface ProductionJobRecipe {
    id: string;
    outputQty: number;
    product: { id: string; name: string; sku: string | null };
    components: BomComponent[];
}

interface ProductionJob {
    id: string;
    tenantId: string;
    recipeId: string;
    productId: string;
    quantity: number;
    status: string;
    notes: string | null;
    startedAt: string | null;
    completedAt: string | null;
    created_at: string;
    recipe: ProductionJobRecipe;
}

interface JobsResponse {
    items: ProductionJob[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

// ------------------------------------------------------------------ //
//  Constants                                                          //
// ------------------------------------------------------------------ //

const JOB_STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const EMPTY_BOM_FORM = {
    productId: '',
    outputQty: 1,
    notes: '',
    components: [] as Array<{ productId: string; quantity: number }>,
};

const EMPTY_JOB_FORM = {
    recipeId: '',
    quantity: 1,
    notes: '',
};

const JOB_STATUS_LABEL_KEYS: Record<string, 'draft' | 'inProgress' | 'completed' | 'cancelled'> = {
    DRAFT: 'draft',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// ------------------------------------------------------------------ //
//  Main Page                                                          //
// ------------------------------------------------------------------ //

export default function ManufacturingPage() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'bom' | 'jobs'>('bom');

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-2">
                <Factory className="h-6 w-6 text-gray-600" />
                <h1 className="text-2xl font-bold text-gray-900">{t.manufacturing.title}</h1>
            </div>

            <div className="flex gap-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('bom')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'bom'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {t.manufacturing.tabs.boms}
                </button>
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'jobs'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {t.manufacturing.tabs.jobs}
                </button>
            </div>

            {activeTab === 'bom' ? <BomTab /> : <JobsTab />}
        </div>
    );
}

// ------------------------------------------------------------------ //
//  Bill of Materials Tab                                              //
// ------------------------------------------------------------------ //

function BomTab() {
    const { t } = useI18n();
    const [boms, setBoms] = useState<BomRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_BOM_FORM });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetchWithAuth('/manufacturing/bom');
            const json = await res.json();
            setBoms(json?.data ?? json ?? []);
        } catch {
            setError(t.manufacturing.loadBomsFailed);
        } finally {
            setLoading(false);
        }
    }, [t.manufacturing.loadBomsFailed]);

    useEffect(() => { load(); }, [load]);

    function openCreate() {
        setEditingId(null);
        setForm({ ...EMPTY_BOM_FORM, components: [] });
        setSaveError('');
        setShowModal(true);
    }

    async function openEdit(bom: BomRecipe) {
        setSaveError('');
        try {
            const res = await fetchWithAuth(`/api/v1/manufacturing/bom/${bom.id}`);
            const json = await res.json();
            const detail: BomRecipeDetail = json?.data ?? json;
            setEditingId(bom.id);
            setForm({
                productId: detail.productId,
                outputQty: detail.outputQty,
                notes: detail.notes ?? '',
                components: detail.components.map((c) => ({
                    productId: c.productId,
                    quantity: Number(c.quantity),
                })),
            });
            setShowModal(true);
        } catch {
            alert(t.manufacturing.loadBomDetailFailed);
        }
    }

    async function handleSave() {
        if (!form.productId.trim()) {
            setSaveError(t.manufacturing.productIdRequired);
            return;
        }
        if (form.outputQty < 1) {
            setSaveError(t.manufacturing.outputQtyMin);
            return;
        }
        setSaving(true);
        setSaveError('');
        try {
            const body = {
                productId: form.productId.trim(),
                outputQty: form.outputQty,
                notes: form.notes || undefined,
                components: form.components.filter((c) => c.productId.trim()),
            };
            const url = editingId
                ? `/api/v1/manufacturing/bom/${editingId}`
                : '/api/v1/manufacturing/bom';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const msg = err?.message;
                throw new Error(Array.isArray(msg) ? msg.join(', ') : (msg ?? t.manufacturing.saveFailed));
            }
            setShowModal(false);
            load();
        } catch (e: any) {
            setSaveError(e.message ?? t.manufacturing.saveFailed);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(t.manufacturing.deleteBomConfirm)) return;
        try {
            await fetchWithAuth(`/api/v1/manufacturing/bom/${id}`, { method: 'DELETE' });
            load();
        } catch {
            alert(t.manufacturing.deleteBomFailed);
        }
    }

    function addComponent() {
        setForm((f) => ({
            ...f,
            components: [...f.components, { productId: '', quantity: 1 }],
        }));
    }

    function removeComponent(index: number) {
        setForm((f) => ({
            ...f,
            components: f.components.filter((_, i) => i !== index),
        }));
    }

    function updateComponent(index: number, field: 'productId' | 'quantity', value: string | number) {
        setForm((f) => ({
            ...f,
            components: f.components.map((c, i) =>
                i === index ? { ...c, [field]: value } : c,
            ),
        }));
    }

    const recipeCountLabel = formatMessage(
        boms.length === 1 ? t.manufacturing.recipeCount : t.manufacturing.recipeCountPlural,
        { count: boms.length },
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{recipeCountLabel}</span>
                <div className="flex gap-2">
                    <button
                        onClick={load}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        {t.manufacturing.newBom}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

            {loading ? (
                <div className="text-center py-12 text-gray-500">{t.common.loading}</div>
            ) : boms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Cog className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>{t.manufacturing.emptyBoms}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.product}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.outputQty}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.components}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.notes}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.created}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {boms.map((bom) => (
                                <tr key={bom.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{bom.productName}</div>
                                        {bom.productSku && (
                                            <div className="text-xs text-gray-500">{bom.productSku}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{bom.outputQty}</td>
                                    <td className="px-4 py-3 text-gray-700">{bom.componentCount}</td>
                                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                                        {bom.notes ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{formatDate(bom.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEdit(bom)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                            >
                                                {t.manufacturing.edit}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bom.id)}
                                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                                            >
                                                {t.manufacturing.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-semibold">
                                {editingId ? t.manufacturing.editBomRecipe : t.manufacturing.newBomRecipe}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {saveError && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{saveError}</div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.manufacturing.outputProductId}
                                </label>
                                <input
                                    type="text"
                                    value={form.productId}
                                    onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                                    placeholder={t.manufacturing.placeholders.productId}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    disabled={!!editingId}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.manufacturing.outputQuantity}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.outputQty}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, outputQty: parseInt(e.target.value) || 1 }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t.manufacturing.outputQtyHint}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.manufacturing.columns.notes}</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t.manufacturing.componentsLabel}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addComponent}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" />
                                        {t.manufacturing.addComponent}
                                    </button>
                                </div>

                                {form.components.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">
                                        {t.manufacturing.noComponents}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {form.components.map((comp, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={comp.productId}
                                                    onChange={(e) =>
                                                        updateComponent(i, 'productId', e.target.value)
                                                    }
                                                    placeholder={t.manufacturing.placeholders.componentProductId}
                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    min={0.0001}
                                                    step={0.0001}
                                                    value={comp.quantity}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            i,
                                                            'quantity',
                                                            parseFloat(e.target.value) || 1,
                                                        )
                                                    }
                                                    placeholder={t.manufacturing.placeholders.qty}
                                                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeComponent(i)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? t.manufacturing.saving : editingId ? t.manufacturing.update : t.manufacturing.create}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ------------------------------------------------------------------ //
//  Production Jobs Tab                                                //
// ------------------------------------------------------------------ //

function JobsTab() {
    const { t } = useI18n();
    const [jobs, setJobs] = useState<ProductionJob[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_JOB_FORM });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [actionError, setActionError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        setActionError('');
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetchWithAuth(`/api/v1/manufacturing/jobs?${params}`);
            const json = await res.json();
            const data: JobsResponse = json?.data ?? json;
            setJobs(data.items ?? []);
            setTotal(data.total ?? 0);
            setPages(data.pages ?? 1);
        } catch {
            setError(t.manufacturing.loadJobsFailed);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, t.manufacturing.loadJobsFailed]);

    useEffect(() => { load(); }, [load]);

    function openCreate() {
        setForm({ ...EMPTY_JOB_FORM });
        setSaveError('');
        setShowModal(true);
    }

    async function handleCreateJob() {
        if (!form.recipeId.trim()) {
            setSaveError(t.manufacturing.recipeIdRequired);
            return;
        }
        if (form.quantity < 1) {
            setSaveError(t.manufacturing.quantityMin);
            return;
        }
        setSaving(true);
        setSaveError('');
        try {
            const body = {
                recipeId: form.recipeId.trim(),
                quantity: form.quantity,
                notes: form.notes || undefined,
            };
            const res = await fetchWithAuth('/manufacturing/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const msg = err?.message;
                throw new Error(Array.isArray(msg) ? msg.join(', ') : (msg ?? t.manufacturing.createJobFailed));
            }
            setShowModal(false);
            load();
        } catch (e: any) {
            setSaveError(e.message ?? t.manufacturing.createJobFailed);
        } finally {
            setSaving(false);
        }
    }

    async function handleJobAction(jobId: string, action: 'start' | 'complete' | 'cancel') {
        const actionLabel = t.manufacturing.jobActions[action];
        if (!confirm(formatMessage(t.manufacturing.jobActionConfirm, { action: actionLabel }))) return;
        setActionError('');
        try {
            const res = await fetchWithAuth(`/api/v1/manufacturing/jobs/${jobId}/${action}`, {
                method: 'POST',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const msg = err?.message;
                throw new Error(Array.isArray(msg) ? msg.join(', ') : (msg ?? formatMessage(t.manufacturing.jobActionFailed, { action })));
            }
            load();
        } catch (e: any) {
            setActionError(e.message ?? formatMessage(t.manufacturing.jobActionFailed, { action }));
        }
    }

    const filterTabs = [
        { label: t.manufacturing.filterAll, value: '' },
        { label: t.manufacturing.jobStatuses.draft, value: 'DRAFT' },
        { label: t.manufacturing.jobStatuses.inProgress, value: 'IN_PROGRESS' },
        { label: t.manufacturing.jobStatuses.completed, value: 'COMPLETED' },
    ];

    const jobCountLabel = formatMessage(
        total === 1 ? t.manufacturing.jobCount : t.manufacturing.jobCountPlural,
        { count: total },
    );

    function getJobStatusLabel(status: string): string {
        const key = JOB_STATUS_LABEL_KEYS[status];
        return key ? t.manufacturing.jobStatuses[key] : status.replace('_', ' ');
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{jobCountLabel}</span>
                <div className="flex gap-2">
                    <button
                        onClick={load}
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        {t.manufacturing.newJob}
                    </button>
                </div>
            </div>

            <div className="flex gap-1 border-b border-gray-200">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            statusFilter === tab.value
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
            {actionError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{actionError}</div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">{t.common.loading}</div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Factory className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>{t.manufacturing.emptyJobs}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.jobId}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.product}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.qty}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.status}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.started}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.completed}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.created}</th>
                                <th className="px-4 py-3 text-left">{t.manufacturing.columns.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                        {job.id.slice(0, 8)}…
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">
                                            {job.recipe?.product?.name ?? job.productId}
                                        </div>
                                        {job.recipe?.product?.sku && (
                                            <div className="text-xs text-gray-500">
                                                {job.recipe.product.sku}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{job.quantity}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                JOB_STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {getJobStatusLabel(job.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {job.startedAt ? formatDate(job.startedAt) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {job.completedAt ? formatDate(job.completedAt) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {formatDate(job.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 flex-wrap">
                                            {job.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handleJobAction(job.id, 'start')}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                >
                                                    {t.manufacturing.jobActions.start}
                                                </button>
                                            )}
                                            {job.status === 'IN_PROGRESS' && (
                                                <button
                                                    onClick={() => handleJobAction(job.id, 'complete')}
                                                    className="text-green-600 hover:text-green-800 text-xs font-medium"
                                                >
                                                    {t.manufacturing.jobActions.complete}
                                                </button>
                                            )}
                                            {(job.status === 'DRAFT' || job.status === 'IN_PROGRESS') && (
                                                <button
                                                    onClick={() => handleJobAction(job.id, 'cancel')}
                                                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                                                >
                                                    {t.manufacturing.jobActions.cancel}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pages > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                        {t.common.prevPage}
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                        {formatMessage(t.manufacturing.pageOf, { page, pages })}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        disabled={page === pages}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                        {t.common.nextPage}
                    </button>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-semibold">{t.manufacturing.newProductionJob}</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {saveError && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{saveError}</div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.manufacturing.bomRecipeId}
                                </label>
                                <input
                                    type="text"
                                    value={form.recipeId}
                                    onChange={(e) => setForm((f) => ({ ...f, recipeId: e.target.value }))}
                                    placeholder={t.manufacturing.placeholders.recipeId}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.manufacturing.quantityLabel}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.quantity}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t.manufacturing.quantityHint}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.manufacturing.columns.notes}</label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                onClick={handleCreateJob}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? t.manufacturing.creating : t.manufacturing.createJob}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}