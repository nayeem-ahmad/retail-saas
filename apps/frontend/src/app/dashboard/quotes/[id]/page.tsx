'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Package, DollarSign, FileText, Share2, ClipboardList, PlusCircle, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

export default function QuoteDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadQuote();
    }, [id]);

    const loadQuote = async () => {
        try {
            const data = await api.getQuotation(id as string);
            setQuote(data);
        } catch (error) {
            console.error('Failed to load quote', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevise = async () => {
        setActionLoading(true);
        try {
             const newQuote = await api.reviseQuotation(id as string);
             router.push(`/dashboard/quotes/${newQuote.id}`);
        } catch (error: any) {
             alert('Error duplicating revision: ' + error.message);
        } finally {
             setActionLoading(false);
        }
    };

    const handleConvertToOrder = async () => {
        setActionLoading(true);
        try {
             const order = await api.convertQuotation(id as string);
             alert('Successfully converted! Order Number: ' + order.order_number);
             await loadQuote(); // Reload to show CONVERTED status
             router.push(`/dashboard/orders/${order.id}`); // Auto jump into active orders
        } catch (error: any) {
             alert('Error converting quote: ' + error.message);
        } finally {
             setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 font-bold text-gray-400">Loading quote...</div>;
    }

    if (!quote) {
        return <div className="p-8 font-bold text-rose-500">Quote not found.</div>;
    }

    const totalAmount = Number(quote.total_amount);

    return (
        <div className="flex-1 overflow-y-auto bg-[#f9fafb] min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <Link href="/dashboard/quotes" className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors w-fit mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Quotes</span>
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-3">
                                <FileText className="w-8 h-8 text-purple-600" />
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">{quote.quote_number} <span className="text-lg bg-gray-100 text-gray-500 px-2 rounded-lg font-black ml-1">v{quote.version}</span></h1>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 mt-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-800`}>
                                    STATUS: {quote.status}
                                </span>
                                <span className="text-sm font-bold text-gray-400">
                                    Expires: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Never'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button onClick={() => window.print()} className="bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-gray-50 shadow-sm transition-all">
                                <Printer className="w-4 h-4 mr-2 text-gray-400" />
                                Print PDF
                            </button>
                            {quote.status !== 'REVISED' && quote.status !== 'CONVERTED' && (
                                <button onClick={handleRevise} disabled={actionLoading} className="bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-amber-200 transition-all">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Revise
                                </button>
                            )}
                            {quote.status !== 'REVISED' && quote.status !== 'CONVERTED' && (
                                <button onClick={handleConvertToOrder} disabled={actionLoading} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    Convert to Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-8 max-w-5xl mx-auto space-y-8 print:p-0 print:block">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:w-full">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
                            <div className="p-6 border-b border-gray-100 print:px-0">
                                <h2 className="font-bold tracking-tight">Proposed Items</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {quote.items.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-center justify-between print:px-0">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                                                <Package className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{item.product?.name || 'Item'}</p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Qty {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">${Number(item.unit_price).toFixed(2)}/ea</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:shadow-none print:border-none print:px-0">
                            <h2 className="font-bold tracking-tight mb-4">Target Account</h2>
                            {quote.customer ? (
                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                    <p className="font-black text-lg text-purple-900">{quote.customer.name}</p>
                                    <p className="text-sm font-bold text-purple-600 uppercase tracking-widest mt-1">{quote.customer.phone}</p>
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-gray-400">Walk-in Draft</p>
                            )}
                        </div>
                        
                        {quote.notes && (
                            <div className="bg-yellow-50 text-yellow-800 p-6 rounded-2xl text-sm font-medium italic">
                                "{quote.notes}"
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border border-gray-400 print:mt-12">
                            <div className="p-6 border-b border-gray-100 bg-gray-900 text-white print:bg-white print:text-black print:border-b-2">
                                <h2 className="font-bold tracking-tight uppercase tracking-widest text-sm">Quote Net Wrap-up</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="pt-2 flex justify-between items-center text-gray-900">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Grand Total</span>
                                    <span className="font-black text-3xl tracking-tight">${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
