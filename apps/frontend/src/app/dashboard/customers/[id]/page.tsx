'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { ArrowLeft, User, Phone, Mail, ShoppingBag } from 'lucide-react';

export default function CustomerProfile() {
    const { id } = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadCustomer();
    }, [id]);

    const loadCustomer = async () => {
        try {
            const data = await api.getCustomer(id as string);
            setCustomer(data);
        } catch (error) {
            console.error('Failed to load profile', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 font-black uppercase tracking-widest text-gray-400">Loading profile...</div>;
    if (!customer) return <div className="p-8 font-black text-rose-500 uppercase">Customer not found.</div>;

    return (
        <div className="overflow-y-auto h-full p-8 bg-[#f9fafb] space-y-8">
            <button onClick={() => router.back()} className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
            </button>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-start space-x-6">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center text-white font-black text-3xl uppercase">
                    {customer.name.substring(0,2)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-3xl font-black tracking-tight">{customer.name}</h1>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                            customer.segment_category === 'VIP' ? 'bg-emerald-50 text-emerald-600' :
                            customer.segment_category === 'At-Risk' ? 'bg-rose-50 text-rose-600' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                            {customer.segment_category}
                        </span>
                    </div>
                    <div className="flex space-x-6 mt-4">
                        <div className="flex items-center text-sm text-gray-600 font-medium"><Phone className="w-4 h-4 mr-2 text-gray-400" /> {customer.phone}</div>
                        {customer.email && <div className="flex items-center text-sm text-gray-600 font-medium"><Mail className="w-4 h-4 mr-2 text-gray-400" /> {customer.email}</div>}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Lifetime Value</p>
                    <p className="text-4xl font-black text-blue-600">${Number(customer.total_spent).toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-black flex items-center"><ShoppingBag className="w-5 h-5 mr-2 text-blue-600" /> Receipt History</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {customer.sales?.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No transactions found.</div>
                    ) : (
                        customer.sales?.map((sale: any) => (
                            <div key={sale.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-black text-sm">{sale.serial_number}</h3>
                                        <p className="text-xs text-gray-500 font-medium">{new Date(sale.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black">${Number(sale.amount_paid).toFixed(2)}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${sale.status === 'COMPLETED' ? 'text-emerald-500' : 'text-gray-400'}`}>{sale.status}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    {sale.items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-700">{item.quantity}x {item.product?.name || 'Unknown Item'}</span>
                                            <span className="font-bold text-gray-900">${(Number(item.price_at_sale) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
