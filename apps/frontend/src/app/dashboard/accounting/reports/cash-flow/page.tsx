'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBDT } from '@/lib/format';

function defaultFrom() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function defaultTo() { return new Date().toISOString().slice(0, 10); }

interface Activity { id: string; name: string; type: string; net_change: number; }
interface CashFlowData {
    filters: { from: string; to: string };
    operating: { activities: Activity[]; net: number };
    investing: { activities: Activity[]; net: number };
    financing: { activities: Activity[]; net: number };
    net_change_in_cash: number;
    opening_cash_balance: number;
    closing_cash_balance: number;
    note: string;
}

function ActivitySection({ label, data, colorClass }: { label: string; data: { activities: Activity[]; net: number }; colorClass: string }) {
    return (
        <div>
            <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${colorClass} mb-2`}>{label}</div>
            {data.activities.map((a) => (
                <div key={a.id} className="flex justify-between items-center px-6 py-1.5 text-sm text-gray-600 border-b border-gray-50">
                    <span>{a.name}</span>
                    <span className={a.net_change >= 0 ? 'text-emerald-700' : 'text-red-700'}>{formatBDT(a.net_change)}</span>
                </div>
            ))}
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-lg font-bold text-sm text-gray-700 mt-1">
                <span>Net {label}</span>
                <span className={data.net >= 0 ? 'text-emerald-700' : 'text-red-700'}>{formatBDT(data.net)}</span>
            </div>
        </div>
    );
}

export default function CashFlowPage() {
    const [data, setData] = useState<CashFlowData | null>(null);
    const [fromDate, setFromDate] = useState(defaultFrom());
    const [toDate, setToDate] = useState(defaultTo());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { void load(); }, [fromDate, toDate]);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const result = await (api as any).getCashFlow({ from: fromDate || undefined, to: toDate || undefined });
            setData(result);
        } catch (err: any) { setError(err?.message ?? 'Failed to load'); }
        finally { setLoading(false); }
    };

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[900px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Cash Flow Statement</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Operating, investing, and financing activities</p>
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
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6">
                        <div className="text-center border-b border-gray-100 pb-4">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Period</p>
                            <p className="text-sm font-bold text-gray-700 mt-1">{data.filters.from} — {data.filters.to}</p>
                        </div>
                        <ActivitySection label="Operating Activities" data={data.operating} colorClass="bg-blue-50 text-blue-700" />
                        <ActivitySection label="Investing Activities" data={data.investing} colorClass="bg-purple-50 text-purple-700" />
                        <ActivitySection label="Financing Activities" data={data.financing} colorClass="bg-orange-50 text-orange-700" />
                        <div className="border-t border-gray-200 pt-4 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Opening Cash Balance</span>
                                <span className="font-medium">{formatBDT(data.opening_cash_balance)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Net Change in Cash</span>
                                <span className={`font-medium ${data.net_change_in_cash >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatBDT(data.net_change_in_cash)}</span>
                            </div>
                            <div className="flex justify-between font-black text-base border-t border-gray-200 pt-2">
                                <span>Closing Cash Balance</span>
                                <span className={data.closing_cash_balance >= 0 ? 'text-emerald-700' : 'text-red-700'}>{formatBDT(data.closing_cash_balance)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 italic">{data.note}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
