'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle, SkipForward } from 'lucide-react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { api } from '../../../../lib/api';

type PostingEventStatus = 'pending' | 'posted' | 'failed' | 'skipped';

type PostingEvent = {
    id: string;
    eventType: string;
    sourceModule: string;
    sourceType: string;
    sourceId: string;
    status: PostingEventStatus;
    attemptCount: number;
    lastError: string | null;
    lastAttemptAt: string | null;
    voucher: { id: string; voucher_number: string; voucher_type: string } | null;
};

type Pagination = { page: number; limit: number; total: number };

const STATUS_STYLES: Record<PostingEventStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    posted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    skipped: 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_ICONS: Record<PostingEventStatus, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    posted: <CheckCircle className="w-3 h-3" />,
    failed: <AlertTriangle className="w-3 h-3" />,
    skipped: <SkipForward className="w-3 h-3" />,
};

const EVENT_TYPE_LABELS: Record<string, string> = {
    sale: 'Sale',
    sale_return: 'Sale Return',
    purchase: 'Purchase',
    purchase_return: 'Purchase Return',
    inventory_adjustment: 'Inventory Adjustment',
    fund_movement: 'Fund Movement',
};

const columnHelper = createColumnHelper<PostingEvent>();

export default function PostingReconciliationPage() {
    const [events, setEvents] = useState<PostingEvent[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        void loadEvents();
    }, [statusFilter, moduleFilter, from, to, page]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await api.getPostingExceptions({
                status: statusFilter || undefined,
                module: moduleFilter || undefined,
                from: from || undefined,
                to: to || undefined,
                page,
                limit: 20,
            });
            setEvents(data.data ?? []);
            setPagination(data.pagination ?? { page: 1, limit: 20, total: 0 });
        } catch (err) {
            console.error('Failed to load posting events', err);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (id: string) => {
        setRetrying(id);
        try {
            await api.retryPostingException(id);
            await loadEvents();
        } catch (err) {
            console.error('Retry failed', err);
        } finally {
            setRetrying(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

    const columns: ColumnDef<PostingEvent, any>[] = useMemo(
        () => [
            columnHelper.accessor('eventType', {
                header: 'Event',
                cell: (info) => (
                    <span className="text-sm font-semibold text-gray-900">
                        {EVENT_TYPE_LABELS[info.getValue()] ?? info.getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('sourceModule', {
                header: 'Module',
                cell: (info) => (
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {info.getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('sourceType', {
                header: 'Source',
                cell: (info) => (
                    <span className="text-sm text-gray-600">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: (info) => {
                    const s = info.getValue() as PostingEventStatus;
                    return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[s] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {STATUS_ICONS[s]}
                            {s}
                        </span>
                    );
                },
            }),
            columnHelper.display({
                id: 'voucher',
                header: 'Voucher',
                cell: ({ row }) => {
                    const v = row.original.voucher;
                    return v ? (
                        <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {v.voucher_number}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">—</span>
                    );
                },
            }),
            columnHelper.accessor('attemptCount', {
                header: 'Attempts',
                cell: (info) => (
                    <span className="text-sm text-gray-500">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor('lastError', {
                header: 'Last Error',
                cell: (info) => {
                    const err = info.getValue();
                    return err ? (
                        <span className="text-xs text-red-600 font-mono">{err}</span>
                    ) : (
                        <span className="text-gray-400 text-xs">—</span>
                    );
                },
            }),
            columnHelper.accessor('lastAttemptAt', {
                header: 'Last Attempt',
                cell: (info) => {
                    const v = info.getValue();
                    return v ? (
                        <span className="text-xs text-gray-500">
                            {new Date(v).toLocaleString()}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">—</span>
                    );
                },
            }),
            columnHelper.display({
                id: 'actions',
                header: '',
                cell: ({ row }) => {
                    const event = row.original;
                    if (event.status === 'posted') return null;
                    return (
                        <button
                            onClick={() => handleRetry(event.id)}
                            disabled={retrying === event.id}
                            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${retrying === event.id ? 'animate-spin' : ''}`} />
                            {retrying === event.id ? 'Queuing…' : 'Retry'}
                        </button>
                    );
                },
            }),
        ],
        [retrying],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1200px] mx-auto space-y-6">
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">
                        Accounting · Reconciliation
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-950">
                                Posting Exceptions
                            </h1>
                            <p className="text-sm text-gray-500">
                                Review failed or skipped accounting posting events and retry them.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="posted">Posted</option>
                            <option value="failed">Failed</option>
                            <option value="skipped">Skipped</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Module</label>
                        <input
                            type="text"
                            value={moduleFilter}
                            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                            placeholder="e.g. sales"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">From</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">To</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => { setTo(e.target.value); setPage(1); }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => { setStatusFilter(''); setModuleFilter(''); setFrom(''); setTo(''); setPage(1); }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Clear
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-16 text-gray-400 text-sm">Loading posting events…</div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <DataTable columns={columns} data={events} />
                        </div>

                        {/* Pagination */}
                        {pagination.total > 0 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>
                                    {pagination.total} event{pagination.total !== 1 ? 's' : ''} total
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="font-medium text-gray-700">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
