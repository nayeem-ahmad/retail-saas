'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Package, DollarSign, Plus, CheckCircle, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';

export default function OrderDetailsPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            const data = await api.getOrder(id as string);
            setOrder(data);
        } catch (error) {
            console.error('Failed to load order', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setStatusUpdating(true);
        try {
            await api.updateOrderStatus(id as string, newStatus);
            await loadOrder();
        } catch (error: any) {
            alert('Failed to update status: ' + (error.message || 'Error occurred. Please check stock levels if assigning to Delivered status.'));
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleAddDeposit = async () => {
        const amt = parseFloat(depositAmount);
        if (!amt || amt <= 0) return;
        
        setDepositModalOpen(false);
        try {
            await api.addOrderDeposit(id as string, { amount: amt, paymentMethod: 'CASH' });
            await loadOrder();
            setDepositAmount('');
        } catch (err: any) {
             alert('Failed to add deposit: ' + err.message);
        }
    };

    if (loading) {
        return <div className="p-8 font-bold text-gray-400">Loading order...</div>;
    }

    if (!order) {
        return <div className="p-8 font-bold text-rose-500">Order not found.</div>;
    }

    const totalAmount = Number(order.total_amount);
    const amountPaid = Number(order.amount_paid);
    const amountDue = totalAmount - amountPaid;

    return (
        <div className="flex-1 overflow-y-auto bg-[#f9fafb] min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <Link href="/dashboard/orders" className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors w-fit mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Orders</span>
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">{order.order_number}</h1>
                            <div className="flex items-center space-x-3 mt-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-800`}>
                                    {order.status}
                                </span>
                                <span className="text-sm font-bold text-gray-400">
                                    {new Date(order.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            {order.status === 'DRAFT' && (
                                <button onClick={() => handleUpdateStatus('CONFIRMED')} disabled={statusUpdating} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md transition-all">
                                    Confirm Order
                                </button>
                            )}
                            {order.status === 'CONFIRMED' && (
                                <button onClick={() => handleUpdateStatus('PROCESSING')} disabled={statusUpdating} className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 shadow-md transition-all">
                                    Start Processing
                                </button>
                            )}
                            {order.status === 'PROCESSING' && (
                                <button onClick={() => handleUpdateStatus('DELIVERED')} disabled={statusUpdating} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-emerald-700 shadow-md transition-all">
                                    <PackageCheck className="w-4 h-4 mr-2" />
                                    Mark Delivered
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-8 max-w-5xl mx-auto space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="font-bold tracking-tight">Order Items</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-center justify-between">
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
                                            <p className="font-black">${(Number(item.price_at_order) * item.quantity).toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">${Number(item.price_at_order).toFixed(2)}/ea</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold tracking-tight mb-4">Customer Details</h2>
                            {order.customer ? (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                    <p className="font-black text-lg text-blue-900">{order.customer.name}</p>
                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{order.customer.phone}</p>
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-gray-400">Walk-in Customer</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Financials */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
                                <h2 className="font-bold tracking-tight">Payment Tracker</h2>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{order.payment_status}</span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                                    <span className="font-black">${totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600">
                                    <span className="text-xs font-bold uppercase tracking-widest">Amount Paid</span>
                                    <span className="font-black">${amountPaid.toFixed(2)}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-rose-600">
                                    <span className="text-xs font-bold uppercase tracking-widest">Amount Due</span>
                                    <span className="font-black text-xl">${amountDue > 0 ? amountDue.toFixed(2) : '0.00'}</span>
                                </div>
                                
                                {amountDue > 0 && order.status !== 'CANCELLED' && (
                                     <button onClick={() => setDepositModalOpen(true)} className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm py-3 rounded-xl transition-colors">
                                         Record Payment Deposit
                                     </button>
                                )}
                            </div>
                        </div>

                        {/* Deposit History */}
                        {order.deposits?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-bold tracking-tight mb-4 text-sm uppercase tracking-widest text-gray-400">Deposit History</h2>
                                <div className="space-y-4">
                                    {order.deposits.map((dep: any) => (
                                        <div key={dep.id} className="flex justify-between items-center p-3 border border-emerald-100 bg-emerald-50 rounded-xl">
                                            <div>
                                                <p className="text-xs font-black uppercase text-emerald-700">{dep.payment_method}</p>
                                                <p className="text-[10px] font-bold text-emerald-600/60 mt-0.5">{new Date(dep.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className="font-black text-emerald-700">${Number(dep.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deposit Modal */}
            {depositModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative">
                         <h3 className="font-black text-lg mb-1">Add Deposit</h3>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Due: ${amountDue.toFixed(2)}</p>
                         
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Amount to Pay (Cash/Card)</label>
                         <div className="relative mb-6">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input 
                                  type="number" 
                                  max={amountDue}
                                  value={depositAmount} 
                                  onChange={e => setDepositAmount(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-10 pr-4 font-black text-2xl focus:ring-2 focus:ring-emerald-500/20" 
                                  placeholder="0.00" 
                              />
                         </div>

                         <div className="flex space-x-3">
                              <button onClick={() => setDepositModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 rounded-xl py-3 transition-colors">Cancel</button>
                              <button onClick={handleAddDeposit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-3 shadow-lg shadow-emerald-200 transition-colors">Confirm</button>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
}
