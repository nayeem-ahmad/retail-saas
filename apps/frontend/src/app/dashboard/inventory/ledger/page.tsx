'use client';

import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { BookOpen, RefreshCw } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { api } from '../../../../lib/api';

interface LedgerRow {
    id: string;
    movement_type: string;
    quantity_delta: number;
    balance_after?: number | null;
    reference_type?: string | null;
    reference_id?: string | null;
    created_at: string;
    product?: { id: string; name: string; sku?: string | null } | null;
    warehouse?: { id: string; name: string } | null;
}

const columnHelper = createColumnHelper<LedgerRow>();

export default function InventoryLedgerPage() {
    const [rows, setRows] = useState<LedgerRow[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [warehouseId, setWarehouseId] = useState('');
    const [movementType, setMovementType] = useState('');

    useEffect(() => {
        void Promise.all([loadLedger(), loadWarehouses()]);
    }, []);

    useEffect(() => {
        void loadLedger();
    }, [warehouseId, movementType]);

    const loadLedger = async () => {
        setLoading(true);
        try {
            const data = await api.getInventoryLedger({ warehouseId: warehouseId || undefined, movementType: movementType || undefined });
            setRows(data);
        } catch (error) {
            console.error('Failed to load inventory ledger', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWarehouses = async () => {
        try {
            const data = await api.getInventoryWarehouses();
            setWarehouses(data);
        } catch (error) {
            console.error('Failed to load warehouses', error);
        }
    };

    const columns: ColumnDef<LedgerRow, any>[] = useMemo(
        () => [
            columnHelper.accessor('created_at', {
                header: 'Timestamp',
                cell: (info) => new Date(info.getValue()).toLocaleString(),
                size: 170,
            }),
            columnHelper.accessor((row) => row.product?.name || '-', {
                id: 'product',
                header: 'Product',
                size: 220,
            }),
            columnHelper.accessor((row) => row.warehouse?.name || '-', {
                id: 'warehouse',
                header: 'Warehouse',
                size: 160,
            }),
            columnHelper.accessor('movement_type', {
                header: 'Movement',
                size: 160,
            }),
            columnHelper.accessor('quantity_delta', {
                header: 'Delta',
                cell: (info) => {
                    const value = Number(info.getValue() || 0);
                    return <span className={value >= 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>{value}</span>;
                },
                size: 80,
            }),
            columnHelper.accessor('balance_after', {
                header: 'Balance',
                cell: (info) => <span className="font-bold">{info.getValue() ?? '-'}</span>,
                size: 90,
            }),
            columnHelper.accessor((row) => row.reference_type && row.reference_id ? `${row.reference_type} • ${row.reference_id}` : '-', {
                id: 'reference',
                header: 'Reference',
                size: 220,
            }),
        ],
        [],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Inventory Ledger</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            Review stock movement history across products and warehouses
                        </p>
                    </div>
                    <button onClick={() => void loadLedger()} className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                    <div className="min-w-[220px]">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Warehouse</label>
                        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium">
                            <option value="">All Warehouses</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[220px]">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Movement Type</label>
                        <input value={movementType} onChange={(e) => setMovementType(e.target.value)} placeholder="e.g. SALE" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                    </div>
                </div>

                <DataTable<LedgerRow>
                    tableId="inventory-ledger"
                    columns={columns}
                    data={rows}
                    title="Stock Ledger"
                    isLoading={loading}
                    emptyMessage="No inventory movements recorded yet"
                    emptyIcon={<BookOpen className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search by product, warehouse, or movement..."
                />
            </div>
        </div>
    );
}