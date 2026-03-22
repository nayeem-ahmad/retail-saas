'use client';

import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { TrendingUp } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { api } from '../../../../../lib/api';

interface ReorderRow {
    product: { id: string; name: string; sku?: string | null; group?: { name: string } | null; subgroup?: { name: string } | null };
    onHand: number;
    inTransit: number;
    targetStock: number | null;
    suggestedQuantity: number;
    shortageReason: string;
    configSource: string;
    leadTimeDays?: number | null;
}

const columnHelper = createColumnHelper<ReorderRow>();

export default function ReorderSuggestionsPage() {
    const [rows, setRows] = useState<ReorderRow[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [subgroups, setSubgroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [warehouseId, setWarehouseId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [subgroupId, setSubgroupId] = useState('');

    useEffect(() => {
        void Promise.all([loadRows(), loadFilters()]);
    }, []);

    useEffect(() => {
        void loadRows();
    }, [warehouseId, groupId, subgroupId]);

    const loadRows = async () => {
        setLoading(true);
        try {
            const data = await api.getReorderSuggestions({
                warehouseId: warehouseId || undefined,
                groupId: groupId || undefined,
                subgroupId: subgroupId || undefined,
            });
            setRows(data);
        } catch (error) {
            console.error('Failed to load reorder suggestions', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFilters = async () => {
        try {
            const [warehouseData, groupData, subgroupData] = await Promise.all([
                api.getInventoryWarehouses(),
                api.getProductGroups(),
                api.getProductSubgroups(),
            ]);
            setWarehouses(warehouseData.filter((warehouse: any) => warehouse.is_active));
            setGroups(groupData);
            setSubgroups(subgroupData);
        } catch (error) {
            console.error('Failed to load reorder filters', error);
        }
    };

    const filteredSubgroups = useMemo(
        () => subgroups.filter((subgroup: any) => !groupId || subgroup.group_id === groupId),
        [subgroups, groupId],
    );

    const columns: ColumnDef<ReorderRow, any>[] = useMemo(
        () => [
            columnHelper.accessor((row) => row.product.name, { id: 'product', header: 'Product', size: 220 }),
            columnHelper.accessor((row) => row.product.group?.name || 'Uncategorized', { id: 'group', header: 'Group', size: 150 }),
            columnHelper.accessor('onHand', { header: 'On Hand', size: 90 }),
            columnHelper.accessor('inTransit', { header: 'In Transit', size: 90 }),
            columnHelper.accessor((row) => row.targetStock ?? '-', { id: 'targetStock', header: 'Target', size: 90 }),
            columnHelper.accessor('suggestedQuantity', {
                header: 'Suggested Qty',
                cell: (info) => <span className="text-sm font-black text-rose-600">{info.getValue()}</span>,
                size: 120,
            }),
            columnHelper.accessor('shortageReason', { header: 'Explanation', size: 320 }),
            columnHelper.accessor('configSource', { header: 'Policy Source', size: 120 }),
        ],
        [],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Reorder Suggestions</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                        Prioritize products that are below target stock after accounting for inbound transfers
                    </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                    <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium min-w-[220px]">
                        <option value="">All Warehouses</option>
                        {warehouses.map((warehouse: any) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                    </select>
                    <select value={groupId} onChange={(e) => { setGroupId(e.target.value); setSubgroupId(''); }} className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium min-w-[220px]">
                        <option value="">All Groups</option>
                        {groups.map((group: any) => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                    <select value={subgroupId} onChange={(e) => setSubgroupId(e.target.value)} className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium min-w-[220px]">
                        <option value="">All Subgroups</option>
                        {filteredSubgroups.map((subgroup: any) => <option key={subgroup.id} value={subgroup.id}>{subgroup.name}</option>)}
                    </select>
                </div>

                <DataTable<ReorderRow>
                    tableId="inventory-reorder-suggestions"
                    columns={columns}
                    data={rows}
                    title="Reorder Suggestions"
                    isLoading={loading}
                    emptyMessage="No reorder suggestions right now"
                    emptyIcon={<TrendingUp className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search reorder suggestions..."
                />
            </div>
        </div>
    );
}