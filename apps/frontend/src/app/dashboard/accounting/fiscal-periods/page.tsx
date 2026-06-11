'use client';

import { useEffect, useState } from 'react';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

interface FiscalPeriod {
    id: string;
    year: number;
    month: number;
    period_label: string;
    is_locked: boolean;
    locked_at: string | null;
}

export default function FiscalPeriodsPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState<string | null>(null);

    useEffect(() => { void load(); }, [year]);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getFiscalPeriods({ year });
            setPeriods(data);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load fiscal periods');
        } finally {
            setLoading(false);
        }
    };

    const toggle = async (p: FiscalPeriod) => {
        const key = `${p.year}-${p.month}`;
        setWorking(key);
        try {
            if (p.is_locked) {
                await api.unlockFiscalPeriod({ year: p.year, month: p.month });
            } else {
                await api.lockFiscalPeriod({ year: p.year, month: p.month });
            }
            await load();
        } catch (e: any) {
            setError(e?.message ?? 'Action failed');
        } finally {
            setWorking(null);
        }
    };

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[900px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Fiscal Period Locking</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                        Lock closed periods to prevent backdated voucher entry
                    </p>
                </div>

                <div className="bg-white border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                        Locking a period prevents any new vouchers from being posted with dates in that period. Only OWNER can unlock a period.
                    </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Fiscal Year</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setYear((y) => y - 1)}
                            className="w-8 h-8 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition">−</button>
                        <span className="text-lg font-black w-16 text-center">{year}</span>
                        <button onClick={() => setYear((y) => y + 1)}
                            className="w-8 h-8 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition">+</button>
                    </div>
                </div>

                {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{error}</div>}

                {loading ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-sm font-medium">Loading…</div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Period</th>
                                    <th className="text-center px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="text-right px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-400">Locked At</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map((p) => {
                                    const key = `${p.year}-${p.month}`;
                                    const isBusy = working === key;
                                    return (
                                        <tr key={p.id} className="border-b border-gray-50 last:border-0">
                                            <td className="px-5 py-3.5 font-bold text-gray-800">{p.period_label}</td>
                                            <td className="px-5 py-3.5 text-center">
                                                {p.is_locked ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700 border border-rose-100">
                                                        <Lock className="w-3 h-3" /> Locked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-100">
                                                        <Unlock className="w-3 h-3" /> Open
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-gray-400 text-xs">
                                                {p.locked_at ? new Date(p.locked_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => toggle(p)}
                                                    disabled={isBusy}
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${p.is_locked
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'}`}
                                                >
                                                    {isBusy ? '…' : p.is_locked ? 'Unlock' : 'Lock Period'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
