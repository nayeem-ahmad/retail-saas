'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileSearch, Plus, Eye, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { api } from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/format';
import CreatePurchaseQuotationModal from './CreatePurchaseQuotationModal';

interface PurchaseQuotation {
    id: string;
    rfq_number: string;
    status: string;
    valid_until: string | null;
    total_amount: string;
    created_at: string;
    notes: string | null;
    supplier?: { id: string; name: string } | null;
    store?: { name: string } | null;
    items: { id: string }[];
}

const statusColors: Record<string, string> = {
    DRAFT:     'bg-gray-50 text-gray-600 border-gray-200',
    SENT:      'bg-blue-50 text-blue-700 border-blue-200',
    RECEIVED:  'bg-amber-50 text-amber-700 border-amber-200',
    ACCEPTED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED:  'bg-red-50 text-red-700 border-red-200',
    CONVERTED: 'bg-violet-50 text-violet-700 border-violet-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const columnHelper = createColumnHelper<PurchaseQuotation>();

export default function PurchaseQuotationsPage() {
    const router = useRouter();
    const [rfqs, setRfqs] = useState<PurchaseQuotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { void load(); }, []);

    const load = async () => {
        try {
            const data = await api.getPurchaseQuotations();
            setRfqs(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this RFQ?')) return;
        try {
            await api.deletePurchaseQuotation(id);
            setRfqs((prev) => prev.filter((r) => r.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        }
    };

    const handleConvert = async (rfq: PurchaseQuotation) => {
        if (!window.confirm(`Convert ${rfq.rfq_number} to a Purchase Order?`)) return;
        try {
            const po = await api.convertPurchaseQuotation(rfq.id);
            alert(`Created Purchase Order ${po.po_number}`);
            void load();
            router.push(`/dashboard/purchase-orders/${po.id}`);
        } catch (err: any) {
            alert(err.message || 'Conversion failed');
        }
    };

    const columns: ColumnDef<PurchaseQuotation, any>[] = useMemo(() => [
        columnHelper.accessor('rfq_number', {
            header: 'RFQ #',
            cell: (info) => <span className="text-sm font-black text-gray-900">{info.getValue()}</span>,
            size: 130,
        }),
        columnHelper.accessor('created_at', {
            header: 'Date',
            cell: (info) => <span className="text-sm text-gray-600">{formatDate(info.getValue())}</span>,
            sortingFn: 'datetime',
            size: 120,
        }),
        columnHelper.accessor((row) => row.supplier?.name ?? '', {
            id: 'supplier',
            header: 'Supplier',
            cell: (info) => (
                <span className="text-sm text-gray-700 font-medium">
                    {info.getValue() || <span className="text-gray-300 italic">No supplier</span>}
                </span>
            ),
            size: 180,
        }),
        columnHelper.accessor((row) => row.items?.length ?? 0, {
            id: 'items',
            header: 'Items',
            cell: (info) => <span className="text-sm font-bold text-gray-700">{info.getValue()} items</span>,
            size: 80,
        }),
        columnHelper.accessor('valid_until', {
            header: 'Valid Until',
            cell: (info) => (
                <span className="text-sm text-gray-600">
                    {info.getValue() ? formatDate(info.getValue() as string) : '—'}
                </span>
            ),
            size: 120,
        }),
        columnHelper.accessor('total_amount', {
            header: 'Total',
            cell: (info) => <span className="text-sm font-black text-blue-600">{formatBDT(parseFloat(info.getValue()))}</span>,
            size: 120,
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: (info) => {
                const s = info.getValue();
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[s] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {s}
                    </span>
                );
            },
            size: 120,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (info) => {
                const rfq = info.row.original;
                const canConvert = rfq.status !== 'CONVERTED' && rfq.status !== 'CANCELLED' && rfq.status !== 'REJECTED';
                return (
                    <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/purchase-quotations/${rfq.id}`}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                        </Link>
                        {canConvert && (
                            <button onClick={() => handleConvert(rfq)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Convert to PO">
                                <ShoppingCart className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => handleDelete(rfq.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            },
            enableSorting: false,
            enableColumnFilter: false,
            size: 120,
        }),
    ], [rfqs]);

    const filterPresets = useMemo(() => [
        { label: 'Draft', filters: [{ id: 'status', value: 'DRAFT' }] },
        { label: 'Sent', filters: [{ id: 'status', value: 'SENT' }] },
        { label: 'Received', filters: [{ id: 'status', value: 'RECEIVED' }] },
        { label: 'Accepted', filters: [{ id: 'status', value: 'ACCEPTED' }] },
        { label: 'Converted', filters: [{ id: 'status', value: 'CONVERTED' }] },
    ], []);

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Purchase Quotations (RFQ)</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            Request price quotes from suppliers
                        </p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5">
                        <Plus className="w-4 h-4 mr-2" />
                        New RFQ
                    </button>
                </div>

                <CreatePurchaseQuotationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={load}
                />

                <DataTable<PurchaseQuotation>
                    tableId="purchase-quotations"
                    columns={columns}
                    data={rfqs}
                    title="Purchase Quotations"
                    isLoading={loading}
                    emptyMessage="No purchase quotations found"
                    emptyIcon={<FileSearch className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search by RFQ #, supplier, status..."
                    filterPresets={filterPresets}
                    enableRowSelection
                />
            </div>
        </div>
    );
}
