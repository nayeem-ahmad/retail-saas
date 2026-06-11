'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBDT } from '@/lib/format';

function defaultFrom() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function defaultTo() { return new Date().toISOString().slice(0, 10); }

interface VatAccount { id: string; name: string; code?: string | null; type: string; total: number; }
interface VatData {
    filters: { from: string; to: string };
    output_vat: { accounts: VatAccount[]; total: number };
    input_vat: { accounts: VatAccount[]; total: number };
    net_vat_payable: number;
    note: string;
}

export default function VatTaxPage() {
    const [data, setData] = useState<VatData | null>(null);
    const [fromDate, setFromDate] = useState(defaultFrom());
    const [toDate, setToDate] = useState(defaultTo());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { void load(); }, [fromDate, toDate]);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const result = await (api as any).getVatTaxReport({ from: fromDate || undefined, to: toDate || undefined });
            setData(result);
        } catch (err: any) { setError(err?.message ?? 'Failed to load'); }
        finally { setLoading(false); }
    };

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[900px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">VAT / Tax Report</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Output VAT collected and input VAT paid</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">From</span>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">To</span>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                    </div>
                </div>
                {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{error}</div>}
                {loading ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-sm font-medium">Loading…</div>
                ) : data ? (
                    <div className="space-y-6">
                        {data.net_vat_payable >= 0 ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-amber-700">Net VAT Payable</p>
                                    <p className="text-2xl font-black text-amber-900 mt-1">{formatBDT(data.net_vat_payable)}</p>
                                </div>
                                <p className="text-xs text-amber-600 max-w-xs text-right">{data.note}</p>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-700">VAT Refundable</p>
                                    <p className="text-2xl font-black text-emerald-900 mt-1">{formatBDT(Math.abs(data.net_vat_payable))}</p>
                                </div>
                                <p className="text-xs text-emerald-600 max-w-xs text-right">{data.note}</p>
                            </div>
                        )}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
                            <div className="font-black text-xs uppercase tracking-widest text-gray-500 mb-3">Output VAT (Collected)</div>
                            {data.output_vat.accounts.map((a) => (
                                <div key={a.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                                    <span className="text-gray-700">{a.name}{a.code && <span className="ml-2 text-xs text-gray-400">{a.code}</span>}</span>
                                    <span className="font-medium text-gray-900">{formatBDT(a.total)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-black text-sm pt-2">
                                <span>Total Output VAT</span>
                                <span className="text-rose-700">{formatBDT(data.output_vat.total)}</span>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
                            <div className="font-black text-xs uppercase tracking-widest text-gray-500 mb-3">Input VAT (Paid)</div>
                            {data.input_vat.accounts.map((a) => (
                                <div key={a.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                                    <span className="text-gray-700">{a.name}{a.code && <span className="ml-2 text-xs text-gray-400">{a.code}</span>}</span>
                                    <span className="font-medium text-gray-900">{formatBDT(a.total)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-black text-sm pt-2">
                                <span>Total Input VAT</span>
                                <span className="text-emerald-700">{formatBDT(data.input_vat.total)}</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
