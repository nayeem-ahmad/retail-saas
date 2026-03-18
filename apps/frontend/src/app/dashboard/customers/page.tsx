'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, MoreVertical, ArrowUpRight, Star, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import AddCustomerModal from './AddCustomerModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await api.getCustomers();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (data: any) => {
        await api.createCustomer(data);
        loadCustomers();
    };

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone.includes(searchQuery)
    );

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#f9fafb] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Track profiles, segmentation, and history</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Customer
                </button>
            </div>

            <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddCustomer} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <SummaryCard title="Total Customers" value={customers.length.toString()} icon={<Users className="text-blue-600" />} color="blue" />
                <SummaryCard title="VIP Segment" value={customers.filter(c => c.segment_category === 'VIP').length.toString()} icon={<Star className="text-emerald-600" />} color="emerald" />
                <SummaryCard title="At-Risk" value={customers.filter(c => c.segment_category === 'At-Risk').length.toString()} icon={<AlertCircle className="text-rose-600" />} color="rose" />
                <SummaryCard title="Avg Spent" value={`$${(customers.reduce((sum, c) => sum + Number(c.total_spent), 0) / (customers.length || 1)).toFixed(0)}`} icon={<ArrowUpRight className="text-amber-600" />} color="amber" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-full focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Total Spent</th>
                                <th className="px-6 py-4">Segment</th>
                                <th className="px-6 py-4 text-right">Registered</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Loading customers...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No customers found.</td></tr>
                            ) : filtered.map((customer) => (
                                <tr key={customer.id} onClick={() => router.push(`/dashboard/customers/${customer.id}`)} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-xs uppercase">{customer.name.substring(0,2)}</div>
                                            <div>
                                                <span className="font-bold text-sm text-gray-900 block">{customer.name}</span>
                                                <span className="text-xs text-gray-500">{customer.email || 'No email'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{customer.phone}</td>
                                    <td className="px-6 py-4 font-black">${Number(customer.total_spent).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                                            customer.segment_category === 'VIP' ? 'bg-emerald-50 text-emerald-600' :
                                            customer.segment_category === 'At-Risk' ? 'bg-rose-50 text-rose-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            {customer.segment_category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-gray-500 font-medium">
                                        {new Date(customer.created_at).toLocaleDateString()}
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

function SummaryCard({ title, value, icon, color = 'blue' }: any) {
    const bgClasses: any = { blue: 'bg-blue-50', rose: 'bg-rose-50', amber: 'bg-amber-50', emerald: 'bg-emerald-50' };
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`w-12 h-12 ${bgClasses[color]} rounded-xl flex items-center justify-center`}>{icon}</div>
            <div>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">{title}</p>
                <h3 className="text-xl font-black tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
