'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, ChevronRight } from 'lucide-react';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        try {
            const data = await api.getQuotations();
            setQuotes(data);
        } catch (error) {
            console.error('Failed to load quotes', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            DRAFT: 'bg-gray-100 text-gray-600',
            SENT: 'bg-blue-100 text-blue-700',
            ACCEPTED: 'bg-emerald-100 text-emerald-700',
            REJECTED: 'bg-red-100 text-red-700',
            CONVERTED: 'bg-purple-100 text-purple-700',
            REVISED: 'bg-amber-100 text-amber-700',
            EXPIRED: 'bg-gray-200 text-gray-500'
        };
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#f9fafb] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Build estimates and track expirations</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Search quotes..." className="bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-full focus:ring-2 focus:ring-gray-200 transition-all" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                <th className="px-6 py-4">Quote Details</th>
                                <th className="px-6 py-4">Target Customer</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Loading records...</td></tr>
                            ) : quotes.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No quotations found.</td></tr>
                            ) : quotes.map((quote: any) => (
                                <tr key={quote.id} className={`transition-colors group ${quote.status === 'REVISED' ? 'opacity-50 hover:opacity-100' : 'hover:bg-gray-50/50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                                <FileText className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm text-gray-900 block">{quote.quote_number} <span className="text-[10px] text-gray-400 uppercase tracking-widest ml-1 bg-gray-100 px-1 py-0.5 rounded">v{quote.version}</span></span>
                                                <span className="text-xs text-gray-400 font-medium">Expires: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Never'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-sm block">{quote.customer?.name || 'Walk-in'}</span>
                                        <span className="text-xs text-gray-500 font-medium">{quote.customer?.phone || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-black text-sm text-gray-900">${Number(quote.total_amount).toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={quote.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/quotes/${quote.id}`}>
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
