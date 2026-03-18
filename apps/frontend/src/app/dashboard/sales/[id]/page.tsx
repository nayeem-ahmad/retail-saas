'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Save, Package, CreditCard, FileText } from 'lucide-react';
import { api } from '../../../../lib/api';

export default function SaleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingNote, setEditingNote] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadSale(params.id as string);
        }
    }, [params.id]);

    const loadSale = async (id: string) => {
        try {
            const data = await api.getSale(id);
            setSale(data);
            setNote(data.note || '');
        } catch (error) {
            console.error('Failed to load sale', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!sale) return;
        setSaving(true);
        try {
            await api.updateSale(sale.id, { note });
            setSale({ ...sale, note });
            setEditingNote(false);
        } catch (error) {
            console.error('Failed to save note', error);
            alert('Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>Sale ${sale?.serial_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
                    h1 { font-size: 24px; margin-bottom: 4px; }
                    .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; }
                    th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; }
                    .total-row { font-weight: bold; border-top: 2px solid #333; }
                    .payment-section { margin-top: 20px; }
                    .note-section { margin-top: 20px; padding: 12px; background: #f9f9f9; border-radius: 8px; }
                    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <div class="footer">Thank you for your purchase!</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f3f4f6]">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading sale...</p>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f3f4f6]">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sale not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/dashboard/sales')}
                            className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">{sale.serial_number}</h1>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                                {new Date(sale.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handlePrint}
                            className="bg-gray-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md flex items-center space-x-2 transition-all hover:-translate-y-0.5"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Preview</span>
                        </button>
                    </div>
                </div>

                {/* Status & Summary */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Status</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            sale.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                            {sale.status}
                        </span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Total</span>
                        <span className="text-xl font-black text-blue-600">${parseFloat(sale.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Paid</span>
                        <span className="text-xl font-black text-gray-900">${parseFloat(sale.amount_paid).toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Items</span>
                        <span className="text-xl font-black text-gray-900">{sale.items?.length || 0}</span>
                    </div>
                </div>

                {/* Print-ready content (hidden on screen, used for print) */}
                <div ref={printRef} className="hidden">
                    <h1>{sale.serial_number}</h1>
                    <div className="subtitle">Date: {new Date(sale.created_at).toLocaleString()} | Status: {sale.status}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item: any) => (
                                <tr key={item.id}>
                                    <td>{item.product?.name || 'Unknown'}</td>
                                    <td>{item.quantity}</td>
                                    <td>${parseFloat(item.price_at_sale).toFixed(2)}</td>
                                    <td>${(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <td colSpan={3}>Total</td>
                                <td>${parseFloat(sale.total_amount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="payment-section">
                        <strong>Payments:</strong>
                        <ul>
                            {sale.payments?.map((p: any, i: number) => (
                                <li key={i}>{p.payment_method}: ${parseFloat(p.amount).toFixed(2)}</li>
                            ))}
                        </ul>
                    </div>
                    {sale.note && (
                        <div className="note-section">
                            <strong>Note:</strong> {sale.note}
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Package className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black tracking-tight">Line Items</h2>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</th>
                                <th className="text-center p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</th>
                                <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Unit Price</th>
                                <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sale.items?.map((item: any) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                                {item.product?.image_url ? (
                                                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <Package className="w-4 h-4 text-gray-200" />
                                                )}
                                            </div>
                                            <span className="text-sm font-black text-gray-900">{item.product?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-gray-400 uppercase">{item.product?.sku || 'N/A'}</td>
                                    <td className="p-4 text-center text-sm font-black">{item.quantity}</td>
                                    <td className="p-4 text-right text-sm font-bold text-gray-700">${parseFloat(item.price_at_sale).toFixed(2)}</td>
                                    <td className="p-4 text-right text-sm font-black text-blue-600">${(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-200">
                                <td colSpan={4} className="p-4 text-right text-sm font-black uppercase tracking-widest">Total</td>
                                <td className="p-4 text-right text-xl font-black text-blue-600">${parseFloat(sale.total_amount).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Payments */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                        <div className="p-2 bg-green-50 rounded-xl text-green-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black tracking-tight">Payment Records</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {sale.payments?.map((payment: any, index: number) => (
                            <div key={index} className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        {payment.payment_method}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleString()}</span>
                                </div>
                                <span className="text-sm font-black text-gray-900">${parseFloat(payment.amount).toFixed(2)}</span>
                            </div>
                        ))}
                        {(!sale.payments || sale.payments.length === 0) && (
                            <div className="p-8 text-center text-gray-300">
                                <p className="text-xs font-black uppercase tracking-widest">No payment records</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Note Section */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-black tracking-tight">Note</h2>
                        </div>
                        {!editingNote ? (
                            <button
                                onClick={() => setEditingNote(true)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => { setEditingNote(false); setNote(sale.note || ''); }}
                                    className="text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm flex items-center space-x-1 transition-all disabled:opacity-50"
                                >
                                    <Save className="w-3 h-3" />
                                    <span>{saving ? 'Saving...' : 'Save'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-6">
                        {editingNote ? (
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-sm resize-none"
                                rows={4}
                                placeholder="Add a note about this sale..."
                            />
                        ) : (
                            <p className="text-sm text-gray-600">
                                {sale.note || <span className="text-gray-300 italic">No note added</span>}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}