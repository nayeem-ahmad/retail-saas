'use client';

import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { Users } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { api } from '../../../../../lib/api';

interface CustomerRow {
    customer: {
        id: string;
        name: string;
        phone: string;
        customerGroup?: { name: string } | null;
        territory?: { name: string } | null;
    };
    transactions: number;
    grossSpend: number;
    returns: number;
    netSpend: number;
    avgOrderValue: number;
}

interface Summary {
    customerCount: number;
    totalNetRevenue: number;
    avgSpendPerCustomer: number;
}

const columnHelper = createColumnHelper<CustomerRow>();

function defaultFrom() {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
}

function defaultTo() {
    return new Date().toISOString().slice(0, 10);
}

export default function TopCustomersPage() {
    const [rows, setRows] = useState<CustomerRow[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [customerGroups, setCustomerGroups] = useState<any[]>([]);
    const [territories, setTerritories] = useState<any[]>([]);
    const [customerGroupId, setCustomerGroupId] = useState('');
    const [territoryId, setTerritoryId] = useState('');
    const [fromDate, setFromDate] = useState(defaultFrom());
    const [toDate, setToDate] = useState(defaultTo());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void Promise.all([loadReport(), loadFilters()]);
    }, []);

    useEffect(() => {
        void loadReport();
    }, [customerGroupId, territoryId, fromDate, toDate]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await api.getTopCustomers({
                customerGroupId: customerGroupId || undefined,
                territoryId: territoryId || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
            });
            setSummary(data.summary);
            setRows(data.rows);
        } catch (error) {
            console.error('Failed to load top customers', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFilters = async () => {
        try {
            const [groupData, territoryData] = await Promise.all([
                api.getCustomerGroups(),
                api.getTerritories(),
            ]);
            setCustomerGroups(groupData);
            setTerritories(territoryData);
        } catch (error) {
            console.error('Failed to load filters', error);
        }
    };

    const columns: ColumnDef<CustomerRow, any>[] = useMemo(
        () => [
            columnHelper.display({
                id: 'rank',
                header: '#',
                cell: (info) => (
                    <span className="text-xs font-black text-gray-400">{info.row.index + 1}</span>
                ),
                size: 48,
            }),
            columnHelper.accessor((row) => row.customer.name, {
                id: 'name',
                header: 'Customer',
                size: 200,
            }),
            columnHelper.accessor((row) => row.customer.phone, {
                id: 'phone',
                header: 'Phone',
                size: 140,
            }),
            columnHelper.accessor((row) => row.customer.customerGroup?.name ?? '-', {
                id: 'group',
                header: 'Group',
                size: 140,
            }),
            columnHelper.accessor((row) => row.customer.territory?.name ?? '-', {
                id: 'territory',
                header: 'Territory',
                size: 130,
            }),
            columnHelper.accessor('transactions', {
                header: 'Orders',
                size: 80,
            }),
            columnHelper.accessor('grossSpend', {
                header: 'Gross Spend',
                cell: (info) => Number(info.getValue()).toFixed(2),
                size: 130,
            }),
            columnHelper.accessor('returns', {
                header: 'Returns',
                cell: (info) => (
                    <span className="text-rose-600">{Number(info.getValue()).toFixed(2)}</span>
                ),
                size: 110,
            }),
            columnHelper.accessor('netSpend', {
                header: 'Net Spend',
                cell: (info) => (
                    <span className="font-black text-blue-700">{Number(info.getValue()).toFixed(2)}</span>
                ),
                size: 130,
            }),
            columnHelper.accessor('avgOrderValue', {
                header: 'Avg Order',
                cell: (info) => Number(info.getValue()).toFixed(2),
                size: 110,
            }),
        ],
        [],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Top Customers</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                        Ranked by net spend — gross purchases minus returns
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customers</div>
                        <div className="text-2xl font-black text-gray-900 mt-2">
                            {summary?.customerCount ?? 0}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Net Revenue</div>
                        <div className="text-2xl font-black text-blue-700 mt-2">
                            {Number(summary?.totalNetRevenue ?? 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Spend / Customer</div>
                        <div className="text-2xl font-black text-gray-900 mt-2">
                            {Number(summary?.avgSpendPerCustomer ?? 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                    <select
                        value={customerGroupId}
                        onChange={(e) => setCustomerGroupId(e.target.value)}
                        className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium min-w-[200px]"
                    >
                        <option value="">All Customer Groups</option>
                        {customerGroups.map((g: any) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <select
                        value={territoryId}
                        onChange={(e) => setTerritoryId(e.target.value)}
                        className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium min-w-[200px]"
                    >
                        <option value="">All Territories</option>
                        {territories.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
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

                <DataTable<CustomerRow>
                    tableId="top-customers"
                    columns={columns}
                    data={rows}
                    title="Customer Rankings"
                    isLoading={loading}
                    emptyMessage="No customer sales recorded in this period"
                    emptyIcon={<Users className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search customers..."
                />
            </div>
        </div>
    );
}
