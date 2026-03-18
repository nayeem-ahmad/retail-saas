'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import IssueReturnModal from './IssueReturnModal';

export default function ReturnsPage() {
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadReturns();
    }, []);

    const loadReturns = async () => {
        try {
            const data = await api.getReturns();
            setReturns(data);
        } catch (error) {
            console.error('Failed to load returns', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#f9fafb] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Returns Management</h1>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Process refunds and re-increment stock</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Process Return
                </button>
            </div>

            <IssueReturnModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadReturns} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Search return records..." className="bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-full focus:ring-2 focus:ring-gray-200 transition-all" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                <th className="px-6 py-4">Return Number</th>
                                <th className="px-6 py-4">Original Receipt</th>
                                <th className="px-6 py-4">Refund Amount</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Loading records...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No returns found.</td></tr>
                            ) : returns.map((ret: any) => (
                                <tr key={ret.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            <span className="font-bold text-sm text-gray-900 block">{ret.return_number}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-500">{ret.sale?.serial_number}</td>
                                    <td className="px-6 py-4 font-black text-rose-600">${Number(ret.total_refund).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                        {ret.items.length} returned
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-gray-500 font-medium">
                                        {new Date(ret.created_at).toLocaleDateString()}
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
