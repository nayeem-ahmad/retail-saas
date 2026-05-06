'use client';

import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { Undo2 } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { api } from '../../../../../lib/api';

interface ReturnRow {
    product: {
        id: string;
        name: string;
        sku?: string | null;
        group?: { name: string } | null;
        subgroup?: { name: string } | null;
    };
    returnEvents: number;
    quantityReturned: number;
    totalRefund: number;
}

interface Summary {
    totalReturnEvents: number;
    totalQtyReturned: number;
    totalRefund: number;
    avgRefundPerReturn: number;
}

const columnHelper = createColumnHelper<ReturnRow>();

function defaultFrom() {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
}

function defaultTo() {
    return new Date().toISOString().slice(0, 10);
}

export default function ReturnsAnalysisPage() {
    const [rows, setRows] = useState<ReturnRow[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [groups, setGroups] = useState<any[]>([]);
    const [subgroups, setSubgroups] = useState<any[]>([]);
    const [groupId, setGroupId] = useState('');
    const [subgroupId, setSubgroupId] = useState('');
    const [fromDate, setFromDate] = useState(defaultFrom());
    const [toDate, setToDate] = useState(defaultTo());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void Promise.all([loadReport(), loadFilters()]);
    }, []);

    useEffect(() => {
        void loadReport();
    }, [groupId, subgroupId, fromDate, toDate]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await api.getReturnsAnalysis({
                groupId: groupId || undefined,
                subgroupId: subgroupId || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
            });
            setSummary(data.summary);
            setRows(data.rows);
        } catch (error) {
            console.error('Failed to load returns analysis', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFilters = async () => {
        try {
            const [groupData, subgroupData] = await Promise.all([
                api.getProductGroups(),
                api.getProductSubgroups(),
            ]);
            setGroups(groupData);
            setSubgroups(subgroupData);
        } catch (error) {
            console.error('Failed to load filters', error);
        }
    };

    const filteredSubgroups = useMemo(
        () => subgroups.filter((s: any) => !groupId || s.group_id === groupId),
        [subgroups, groupId],
    );

    const columns: ColumnDef<ReturnRow, any>[] = useMemo(
        () => [
            columnHelper.accessor((row) => row.product.name, {
                id: 'product',
                header: 'Product',
                size: 240,
            }),
            columnHelper.accessor((row) => row.product.sku ?? '-', {
                id: 'sku',
                header: 'SKU',
                size: 120,
            }),
            columnHelper.accessor((row) => row.product.group?.name ?? 'Uncategorized', {
                id: 'group',
                header: 'Group',
                size: 160,
            }),
            columnHelper.accessor('returnEvents', {
                header: 'Return Events',
                size: 120,
            }),
            columnHelper.accessor('quantityReturned', {
                header: 'Qty Returned',
                size: 120,
            }),
            columnHelper.accessor('totalRefund', {
                header: 'Total Refund',
                cell: (info) => (
                    <span className="font-black text-rose-600">{Number(info.getValue()).toFixed(2)}</span>
                ),
                size: 140,
            }),
        ],
        [],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Returns Analysis</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                        Returned products ranked by refund value — spot quality and policy issues
                    </p>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Return Events</div>
                        <div className="text-2xl font-black text-gray-900 mt-2">
                            {summary?.totalReturnEvents ?? 0}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Units Returned</div>
                        <div className="text-2xl font-black text-gray-900 mt-2">
                            {summary?.totalQtyReturned ?? 0}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Refund</div>
                        <div className="text-2xl font-black text-rose-600 mt-2">
                            {Number(summary?.totalRefund ?? 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Refund / Return</div>
                        <div className="text-2xl font-black text-gray-900 mt-2">
                            {Number(summary?.avgRefundPerReturn ?? 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                    <select
                        value={groupId}
                        onChange={(e) => { setGroupId(e.target.value); setSubgroupId(''); }}
                        className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium min-w-[200px]"
                    >
                        <option value="">All Groups</option>
                        {groups.map((g: any) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <select
                        value={subgroupId}
                        onChange={(e) => setSubgroupId(e.target.value)}
                        className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium min-w-[200px]"
                    >
                        <option value="">All Subgroups</option>
                        {filteredSubgroups.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">From</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">To</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium"
                        />
                    </div>
                </div>

                <DataTable<ReturnRow>
                    tableId="returns-analysis"
                    columns={columns}
                    data={rows}
                    title="Returns by Product"
                    isLoading={loading}
                    emptyMessage="No returns recorded in this period"
                    emptyIcon={<Undo2 className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search products..."
                />
            </div>
        </div>
    );
}
