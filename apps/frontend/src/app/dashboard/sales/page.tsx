'use client';

import { useState, useEffect } from 'react';
import { Receipt, Search, Eye, ChevronRight } from 'lucide-react';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function SalesHistoryPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            const data = await api.getSales();
            setSales(data);
        } catch (error) {
            console.error('Failed to load sales', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(s =>
        s.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
            case 'REFUNDED': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'PARTIAL_REFUND': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Sales History</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">All completed transactions</p>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by serial or customer..."
                            className="w-full bg-white border-none rounded-xl py-2.5 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading sales...</div>
                    ) : filteredSales.length === 0 ? (
                        <div className="p-12 text-center">
                            <Receipt className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-300">No sales found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Serial #</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Items</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Total</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Paid</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Payments</th>
                                    <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <span className="text-sm font-black text-gray-900">{sale.serial_number}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600">{new Date(sale.created_at).toLocaleDateString()}</span>
                                            <span className="text-xs text-gray-400 block">{new Date(sale.created_at).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-bold text-gray-700">{sale.items?.length || 0} items</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-black text-blue-600">${parseFloat(sale.total_amount).toFixed(2)}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-bold text-gray-700">${parseFloat(sale.amount_paid).toFixed(2)}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(sale.status)}`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {sale.payments?.map((p: any, i: number) => (
                                                    <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                        {p.payment_method}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/dashboard/sales/${sale.id}`}
                                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-widest transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>View</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}