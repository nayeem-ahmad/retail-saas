'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, ChevronRight, PackageCheck, Package } from 'lucide-react';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await api.getOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            DRAFT: 'bg-gray-100 text-gray-600',
            CONFIRMED: 'bg-blue-100 text-blue-700',
            PROCESSING: 'bg-amber-100 text-amber-700',
            DELIVERED: 'bg-emerald-100 text-emerald-700',
            CANCELLED: 'bg-red-100 text-red-700'
        };
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
    };

    const PaymentBadge = ({ status }: { status: string }) => {
        const styles: any = {
            UNPAID: 'bg-gray-100 text-gray-600 font-bold',
            PARTIAL: 'bg-purple-100 text-purple-700 font-black',
            PAID: 'bg-emerald-100 text-emerald-700 font-black'
        };
        return <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#f9fafb] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales Orders</h1>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Manage fulfillment and deposits</p>
                </div>
                {/* For complete creation cycle, implement 'AddOrderModal'. Currently we verify management and status cycle. */}
                {/* 
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Order
                </button>
                */}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Search orders..." className="bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-full focus:ring-2 focus:ring-gray-200 transition-all" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                <th className="px-6 py-4">Order details</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Financials</th>
                                <th className="px-6 py-4">Fulfillment</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Loading records...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No orders found.</td></tr>
                            ) : orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                {order.status === 'DELIVERED' ? <PackageCheck className="w-5 h-5"/> : <Package className="w-5 h-5"/>}
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm text-gray-900 block">{order.order_number}</span>
                                                <span className="text-xs text-gray-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-sm block">{order.customer?.name || 'Walk-in'}</span>
                                        <span className="text-xs text-gray-500 font-medium">{order.customer?.phone || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1 items-start">
                                            <span className="font-black text-sm text-gray-900">${Number(order.total_amount).toFixed(2)}</span>
                                            <PaymentBadge status={order.payment_status} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/orders/${order.id}`}>
                                            <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-900 transition-colors hover:shadow-sm border border-transparent hover:border-gray-200">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
