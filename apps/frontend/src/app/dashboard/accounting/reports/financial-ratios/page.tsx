'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBDT } from '@/lib/format';

function defaultFrom() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function defaultTo() { return new Date().toISOString().slice(0, 10); }

interface RatiosData {
    as_of: string;
    period: { from: string; to: string };
    ratios: {
        current_ratio: number | null;
        gross_margin_pct: number | null;
        net_profit_margin_pct: number | null;
        dso_days: number | null;
        dpo_days: number | null;
        revenue: number;
        total_expenses: number;
        net_profit: number;
        total_assets: number;
        total_liabilities: number;
    };
}

function RatioCard({ label, value, description, format, healthyCondition }: {
    label: string;
    value: number | null;
    description: string;
    format?: 'number' | 'pct' | 'days' | 'bdt';
    healthyCondition?: (v: number) => boolean;
}) {
    const isHealthy = value !== null && healthyCondition ? healthyCondition(value) : null;
    const formattedValue = value === null ? 'N/A' :
        format === 'pct' ? `${value.toFixed(1)}%` :
        format === 'days' ? `${value.toFixed(1)} days` :
        format === 'bdt' ? formatBDT(value) :
        value.toFixed(2);

    return (
        <div className={`bg-white border rounded-2xl p-5 ${isHealthy === true ? 'border-emerald-200' : isHealthy === false ? 'border-red-200' : 'border-gray-100'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`text-2xl font-black mt-1 ${isHealthy === true ? 'text-emerald-700' : isHealthy === false ? 'text-red-700' : 'text-gray-800'}`}>
                {formattedValue}
            </p>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
    );
}

export default function FinancialRatiosPage() {
    const [data, setData] = useState<RatiosData | null>(null);
    const [asOfDate, setAsOfDate] = useState(defaultTo());
    const [fromDate, setFromDate] = useState(defaultFrom());
    const [toDate, setToDate] = useState(defaultTo());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { void load(); }, [asOfDate, fromDate, toDate]);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const result = await (api as any).getFinancialRatios({
                asOfDate: asOfDate || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
            });
            setData(result);
        } catch (err: any) { setError(err?.message ?? 'Failed to load'); }
        finally { setLoading(false); }
    };

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1000px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Financial Ratios</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Key financial health indicators</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">As Of (Balance Sheet)</span>
                        <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">From (P&L)</span>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">To (P&L)</span>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                    </div>
                </div>
                {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{error}</div>}
                {loading ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-sm font-medium">Loading…</div>
                ) : data ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <RatioCard label="Current Ratio" value={data.ratios.current_ratio} description="Assets / Liabilities (>1 is healthy)" format="number" healthyCondition={(v) => v >= 1} />
                            <RatioCard label="Gross Margin" value={data.ratios.gross_margin_pct} description="Net Profit / Revenue × 100" format="pct" healthyCondition={(v) => v >= 0} />
                            <RatioCard label="Net Profit Margin" value={data.ratios.net_profit_margin_pct} description="Net Profit / Revenue × 100" format="pct" healthyCondition={(v) => v >= 0} />
                            <RatioCard label="DSO (Days)" value={data.ratios.dso_days} description="Days Sales Outstanding — lower is better" format="days" healthyCondition={(v) => v <= 45} />
                            <RatioCard label="DPO (Days)" value={data.ratios.dpo_days} description="Days Payable Outstanding" format="days" healthyCondition={(v) => v <= 60} />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-6">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Summary</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div><p className="text-gray-400 text-xs">Revenue</p><p className="font-bold">{formatBDT(data.ratios.revenue)}</p></div>
                                <div><p className="text-gray-400 text-xs">Total Expenses</p><p className="font-bold">{formatBDT(data.ratios.total_expenses)}</p></div>
                                <div><p className="text-gray-400 text-xs">Net Profit</p><p className={`font-bold ${data.ratios.net_profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatBDT(data.ratios.net_profit)}</p></div>
                                <div><p className="text-gray-400 text-xs">Total Assets</p><p className="font-bold">{formatBDT(data.ratios.total_assets)}</p></div>
                                <div><p className="text-gray-400 text-xs">Total Liabilities</p><p className="font-bold">{formatBDT(data.ratios.total_liabilities)}</p></div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
