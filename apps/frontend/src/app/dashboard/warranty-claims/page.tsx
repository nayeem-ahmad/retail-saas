'use client';

import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { ShieldCheck, Search, Plus, X } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { api } from '../../../lib/api';

interface SerialLookupResult {
    serial: {
        id: string;
        serial_number: string;
        product_id: string;
        status: string;
        sold_at?: string | null;
        claim_reference?: string | null;
        claims: Array<{ id: string; claim_number: string; status: string; created_at: string; customer_name: string }>;
    };
    product?: { id: string; name: string; warranty_enabled: boolean; warranty_duration_days?: number | null } | null;
    warrantyExpired: boolean;
    warrantyExpiresAt?: string | null;
}

interface WarrantyClaim {
    id: string;
    claim_number: string;
    status: string;
    customer_name: string;
    customer_phone?: string | null;
    issue_description: string;
    resolution_notes?: string | null;
    created_at: string;
    serial?: { serial_number: string; product_id: string; sold_at?: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
    OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    CLOSED: 'bg-gray-50 text-gray-500 border-gray-200',
};

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];

const columnHelper = createColumnHelper<WarrantyClaim>();

export default function WarrantyClaimsPage() {
    const [claims, setClaims] = useState<WarrantyClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const [serialInput, setSerialInput] = useState('');
    const [lookupResult, setLookupResult] = useState<SerialLookupResult | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);

    const [form, setForm] = useState({ customerName: '', customerPhone: '', issueDescription: '' });
    const [formMessage, setFormMessage] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const [updateModal, setUpdateModal] = useState<{ claim: WarrantyClaim; status: string; notes: string } | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        void loadClaims();
    }, [statusFilter]);

    const loadClaims = async () => {
        setLoading(true);
        try {
            const data = await api.getWarrantyClaims({ status: statusFilter || undefined });
            setClaims(data);
        } catch (error) {
            console.error('Failed to load warranty claims', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serialInput.trim()) return;
        setLookupLoading(true);
        setLookupError('');
        setLookupResult(null);
        try {
            const result = await api.lookupWarrantySerial(serialInput.trim());
            setLookupResult(result);
        } catch (error: any) {
            setLookupError(error.message || 'Serial number not found.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupResult) return;
        setFormLoading(true);
        setFormMessage('');
        try {
            await api.createWarrantyClaim({
                serialId: lookupResult.serial.id,
                customerName: form.customerName,
                customerPhone: form.customerPhone || undefined,
                issueDescription: form.issueDescription,
            });
            setFormMessage('Warranty claim created successfully.');
            setForm({ customerName: '', customerPhone: '', issueDescription: '' });
            setLookupResult(null);
            setSerialInput('');
            await loadClaims();
        } catch (error: any) {
            setFormMessage(error.message || 'Failed to create claim.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!updateModal) return;
        setUpdateLoading(true);
        try {
            await api.updateWarrantyClaimStatus(updateModal.claim.id, {
                status: updateModal.status,
                resolutionNotes: updateModal.notes || undefined,
            });
            setUpdateModal(null);
            await loadClaims();
        } catch (error: any) {
            console.error('Failed to update status', error);
        } finally {
            setUpdateLoading(false);
        }
    };

    const columns: ColumnDef<WarrantyClaim, any>[] = useMemo(
        () => [
            columnHelper.accessor('claim_number', {
                header: 'Claim #',
                cell: (info) => <span className="text-sm font-black text-gray-900">{info.getValue()}</span>,
                size: 130,
            }),
            columnHelper.accessor((row) => row.serial?.serial_number ?? '-', {
                id: 'serial_number',
                header: 'Serial #',
                cell: (info) => <span className="text-sm font-mono text-gray-700">{info.getValue()}</span>,
                size: 160,
            }),
            columnHelper.accessor('customer_name', {
                header: 'Customer',
                cell: (info) => <span className="text-sm text-gray-700">{info.getValue()}</span>,
                size: 160,
            }),
            columnHelper.accessor('issue_description', {
                header: 'Issue',
                cell: (info) => <span className="text-sm text-gray-600 line-clamp-2">{info.getValue()}</span>,
                size: 240,
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: (info) => {
                    const status = info.getValue();
                    return (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            {status.replace('_', ' ')}
                        </span>
                    );
                },
                size: 130,
            }),
            columnHelper.accessor('created_at', {
                header: 'Created',
                cell: (info) => {
                    const d = new Date(info.getValue());
                    return (
                        <div>
                            <span className="text-sm text-gray-600">{d.toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400 block">{d.toLocaleTimeString()}</span>
                        </div>
                    );
                },
                sortingFn: 'datetime',
                size: 150,
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: (info) => {
                    const row = info.row.original;
                    return (
                        <button
                            onClick={() => setUpdateModal({ claim: row, status: row.status, notes: row.resolution_notes ?? '' })}
                            className="text-sm font-black text-blue-700 hover:text-blue-900"
                        >
                            Update
                        </button>
                    );
                },
                size: 90,
            }),
        ],
        [],
    );

    const filterPresets = useMemo(
        () => [
            { label: 'Open', filters: [{ id: 'status', value: 'OPEN' }] },
            { label: 'In Progress', filters: [{ id: 'status', value: 'IN_PROGRESS' }] },
            { label: 'Resolved', filters: [{ id: 'status', value: 'RESOLVED' }] },
        ],
        [],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Warranty Claims</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            Look up serial numbers and manage warranty claims
                        </p>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700"
                    >
                        <option value="">All Statuses</option>
                        {VALID_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* Serial Lookup */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-600" />
                        <h2 className="font-black text-lg">Serial Number Lookup</h2>
                    </div>
                    <form onSubmit={handleLookup} className="flex gap-3">
                        <input
                            value={serialInput}
                            onChange={(e) => setSerialInput(e.target.value)}
                            className="flex-1 bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium font-mono"
                            placeholder="Enter serial number..."
                        />
                        <button
                            type="submit"
                            disabled={lookupLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 disabled:opacity-60"
                        >
                            {lookupLoading ? 'Searching...' : 'Lookup'}
                        </button>
                        {lookupResult && (
                            <button
                                type="button"
                                onClick={() => { setLookupResult(null); setSerialInput(''); setLookupError(''); }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </form>

                    {lookupError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-bold">
                            {lookupError}
                        </div>
                    )}

                    {lookupResult && (
                        <div className="space-y-4">
                            {/* Serial Info */}
                            <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Serial #</p>
                                    <p className="text-sm font-black font-mono text-gray-900">{lookupResult.serial.serial_number}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Product</p>
                                    <p className="text-sm font-bold text-gray-900">{lookupResult.product?.name ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${lookupResult.serial.status === 'SOLD' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                        {lookupResult.serial.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Warranty</p>
                                    {!lookupResult.product?.warranty_enabled ? (
                                        <span className="text-sm text-gray-400 font-bold">Not covered</span>
                                    ) : lookupResult.warrantyExpired ? (
                                        <span className="text-sm text-red-600 font-black">Expired</span>
                                    ) : (
                                        <span className="text-sm text-emerald-600 font-black">
                                            Valid{lookupResult.warrantyExpiresAt ? ` until ${new Date(lookupResult.warrantyExpiresAt).toLocaleDateString()}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Previous Claims */}
                            {lookupResult.serial.claims.length > 0 && (
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Previous Claims</p>
                                    <div className="space-y-2">
                                        {lookupResult.serial.claims.map((c) => (
                                            <div key={c.id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-xl px-4 py-2.5">
                                                <span className="font-black text-gray-900">{c.claim_number}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[c.status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>{c.status}</span>
                                                <span className="text-gray-500">{c.customer_name}</span>
                                                <span className="text-gray-400 ml-auto">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Claim Form */}
                            {lookupResult.serial.status === 'SOLD' && (
                                <form onSubmit={handleCreate} className="space-y-4 border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-gray-600" />
                                        <p className="font-black text-sm">New Claim for this Serial</p>
                                    </div>
                                    {formMessage && (
                                        <div className="text-sm font-bold text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{formMessage}</div>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Customer Name</label>
                                            <input
                                                required
                                                value={form.customerName}
                                                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium"
                                                placeholder="Full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Phone (optional)</label>
                                            <input
                                                value={form.customerPhone}
                                                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium"
                                                placeholder="+1 555 000 0000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Issue Description</label>
                                        <textarea
                                            required
                                            value={form.issueDescription}
                                            onChange={(e) => setForm((f) => ({ ...f, issueDescription: e.target.value }))}
                                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium resize-none"
                                            rows={3}
                                            placeholder="Describe the problem..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={formLoading}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 disabled:opacity-60"
                                        >
                                            {formLoading ? 'Submitting...' : 'Submit Claim'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Claims Table */}
                <DataTable<WarrantyClaim>
                    tableId="warranty-claims"
                    columns={columns}
                    data={claims}
                    title="Warranty Claims"
                    isLoading={loading}
                    emptyMessage="No warranty claims yet"
                    emptyIcon={<ShieldCheck className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search claims..."
                    filterPresets={filterPresets}
                />
            </div>

            {/* Update Status Modal */}
            {updateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-lg">Update Claim Status</h3>
                            <button onClick={() => setUpdateModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 font-mono">{updateModal.claim.claim_number}</p>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Status</label>
                            <select
                                value={updateModal.status}
                                onChange={(e) => setUpdateModal((m) => m ? { ...m, status: e.target.value } : null)}
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium"
                            >
                                {VALID_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Resolution Notes</label>
                            <textarea
                                value={updateModal.notes}
                                onChange={(e) => setUpdateModal((m) => m ? { ...m, notes: e.target.value } : null)}
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium resize-none"
                                rows={3}
                                placeholder="Optional notes..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setUpdateModal(null)} className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200">
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={updateLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 disabled:opacity-60"
                            >
                                {updateLoading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
