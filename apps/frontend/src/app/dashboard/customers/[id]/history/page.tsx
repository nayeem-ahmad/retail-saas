'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import {
    ArrowLeft,
    ShoppingBag,
    TrendingUp,
    Calendar,
    Clock,
    Package,
    BarChart3,
} from 'lucide-react';

interface MonthlyTotal {
    month: string;
    orders: number;
    spent: number;
}

interface TopProduct {
    productId: string;
    name: string;
    quantity: number;
    totalValue: number;
    orderCount: number;
}

interface Transaction {
    id: string;
    serial_number: string;
    created_at: string;
    amount_paid: string | number;
    status: string;
    items: { id: string; quantity: number; price_at_sale: string | number; product?: { name: string } }[];
}

interface PurchaseHistory {
    customer: {
        id: string;
        name: string;
        customer_code: string;
        segment_category: string;
        total_spent: string | number;
    };
    summary: {
        totalOrders: number;
        totalSpent: number;
        avgOrderValue: number;
        firstPurchase: string | null;
        lastPurchase: string | null;
        purchaseFrequencyDays: number | null;
    };
    monthlyTotals: MonthlyTotal[];
    topProducts: TopProduct[];
    transactions: Transaction[];
}

export default function PurchaseHistoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<PurchaseHistory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadHistory();
    }, [id]);

    const loadHistory = async () => {
        try {
            const result = await api.getCustomerHistory(id as string);
            setData(result);
        } catch (error) {
            console.error('Failed to load purchase history', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 font-black uppercase tracking-widest text-gray-400">Loading...</div>;
    if (!data) return <div className="p-8 font-black text-rose-500 uppercase">History not found.</div>;

    const { customer, summary, monthlyTotals, topProducts, transactions } = data;

    const maxMonthlySpend = Math.max(...monthlyTotals.map((m) => m.spent), 1);

    return (
        <div className="overflow-y-auto h-full p-8 bg-[#f9fafb] space-y-8">
            {/* Back navigation */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">{customer.name}</h1>
                    <p className="text-xs font-mono text-gray-400">{customer.customer_code}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ml-2 ${
                    customer.segment_category === 'VIP' ? 'bg-emerald-50 text-emerald-600' :
                    customer.segment_category === 'At-Risk' ? 'bg-rose-50 text-rose-600' :
                    'bg-gray-100 text-gray-600'
                }`}>
                    {customer.segment_category}
                </span>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <SummaryCard
                    label="Total Orders"
                    value={String(summary.totalOrders)}
                    icon={<ShoppingBag className="w-5 h-5 text-blue-500" />}
                    bg="bg-blue-50"
                />
                <SummaryCard
                    label="Lifetime Value"
                    value={`৳${summary.totalSpent.toFixed(2)}`}
                    icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                    bg="bg-emerald-50"
                />
                <SummaryCard
                    label="Avg. Order Value"
                    value={`৳${summary.avgOrderValue.toFixed(2)}`}
                    icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
                    bg="bg-amber-50"
                />
                <SummaryCard
                    label="Purchase Frequency"
                    value={summary.purchaseFrequencyDays != null ? `every ${summary.purchaseFrequencyDays}d` : '—'}
                    icon={<Clock className="w-5 h-5 text-purple-500" />}
                    bg="bg-purple-50"
                />
            </div>

            {/* Date range */}
            {summary.firstPurchase && summary.lastPurchase && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center space-x-6">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Purchase Timeline</p>
                        <p className="text-sm font-bold text-gray-700 mt-0.5">
                            {new Date(summary.firstPurchase).toLocaleDateString()} — {new Date(summary.lastPurchase).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly spending chart */}
                {monthlyTotals.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-5">Monthly Spending</p>
                        <div className="space-y-3">
                            {monthlyTotals.slice(-12).map((m) => (
                                <div key={m.month} className="flex items-center space-x-3">
                                    <span className="text-xs font-mono text-gray-400 w-16 flex-shrink-0">{m.month}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${(m.spent / maxMonthlySpend) * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-right flex-shrink-0 w-28">
                                        <span className="text-xs font-black text-gray-900">৳{m.spent.toFixed(0)}</span>
                                        <span className="text-[10px] text-gray-400 ml-1">({m.orders} orders)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top products */}
                {topProducts.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-5">Top Products</p>
                        <div className="space-y-3">
                            {topProducts.map((p, i) => (
                                <div key={p.productId} className="flex items-center space-x-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <Package className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                    <span className="flex-1 text-sm font-bold text-gray-800 truncate">{p.name}</span>
                                    <div className="text-right flex-shrink-0">
                                        <span className="text-xs font-black text-gray-900">৳{p.totalValue.toFixed(0)}</span>
                                        <span className="block text-[10px] text-gray-400">{p.quantity} units</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction list */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-black flex items-center">
                        <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" /> All Transactions
                        <span className="ml-2 text-sm font-bold text-gray-400">({transactions.length})</span>
                    </h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                            No transactions found.
                        </div>
                    ) : (
                        transactions.map((sale) => (
                            <div key={sale.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-black text-sm">{sale.serial_number}</h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {new Date(sale.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {sale.items.map((item) => `${item.quantity}× ${item.product?.name ?? 'Item'}`).join(', ')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black">৳{Number(sale.amount_paid).toFixed(2)}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                                            sale.status === 'COMPLETED' ? 'text-emerald-500' : 'text-gray-400'
                                        }`}>
                                            {sale.status}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, icon, bg }: { label: string; value: string; icon: React.ReactNode; bg: string }) {
    return (
        <div className={`${bg} border border-white rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
                {icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
    );
}
