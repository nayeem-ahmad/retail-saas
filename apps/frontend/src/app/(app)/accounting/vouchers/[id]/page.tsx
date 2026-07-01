'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookText } from 'lucide-react';
import { api } from '@/lib/api';
import { formatBDT, formatDate } from '@/lib/format';
import { useI18n, formatMessage } from '@/lib/i18n';

type VoucherDetail = {
    id: string;
    voucher_number: string;
    voucher_type: string;
    description?: string | null;
    reference_number?: string | null;
    date: string;
    total_amount: number;
    details: Array<{
        id: string;
        debit_amount: number;
        credit_amount: number;
        comment?: string | null;
        account: {
            name: string;
            code?: string | null;
            group?: { name: string };
            subgroup?: { name: string } | null;
        };
    }>;
};

export default function VoucherDetailPage() {
    const { t, locale } = useI18n();
    const params = useParams<{ id: string }>();
    const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const loadVoucher = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await api.getVoucher(params.id);
                if (!active) {
                    return;
                }

                setVoucher(data);
            } catch (loadError) {
                if (!active) {
                    return;
                }

                setError(loadError instanceof Error ? loadError.message : 'Failed to load voucher detail.');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadVoucher();

        return () => {
            active = false;
        };
    }, [params.id]);

    const debitTotal = voucher?.details.reduce((sum, row) => sum + Number(row.debit_amount || 0), 0) ?? 0;
    const creditTotal = voucher?.details.reduce((sum, row) => sum + Number(row.credit_amount || 0), 0) ?? 0;

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-5xl mx-auto space-y-6">
                <Link href="/accounting/vouchers" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Vouchers
                </Link>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700">
                            <BookText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">{t.journal.detail.story}</p>
                            <h1 className="text-2xl font-black tracking-tight">Voucher Detail</h1>
                            <p className="mt-2 max-w-3xl text-sm text-gray-500">
                                Inspect the full debit and credit composition of a single posted voucher.
                            </p>
                        </div>
                    </div>
                </section>

                {loading ? <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm text-sm font-bold text-gray-500">{t.journal.detail.loading}</div> : null}
                {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm text-sm font-bold text-red-600">{error}</div> : null}

                {voucher ? (
                    <>
                        <section className="grid gap-4 md:grid-cols-4">
                            <DetailStat label={t.journal.columns.voucherNumber} value={voucher.voucher_number} />
                            <DetailStat label={t.accountingShared.type} value={voucher.voucher_type.replaceAll('_', ' ')} />
                            <DetailStat label={t.accountingShared.date} value={formatDate(voucher.date, locale)} />
                            <DetailStat label={t.accountingShared.reference} value={voucher.reference_number || t.accountingShared.notProvided} />
                        </section>

                        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">{t.accountingShared.narration}</p>
                                <p className="mt-2 text-sm text-gray-700">{voucher.description || t.journal.detail.noNarrationCaptured}</p>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">{t.accountingShared.account}</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">{t.accountingShared.group}</th>
                                            <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">{t.accountingShared.debit}</th>
                                            <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">{t.accountingShared.credit}</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">{t.accountingShared.comment}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {voucher.details.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-4 py-3 text-sm font-black text-gray-900">{row.account.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{row.account.group?.name || 'Ungrouped'}</td>
                                                <td className="px-4 py-3 text-right text-sm font-black text-amber-700">{formatBDT(Number(row.debit_amount || 0), { locale })}</td>
                                                <td className="px-4 py-3 text-right text-sm font-black text-sky-700">{formatBDT(Number(row.credit_amount || 0), { locale })}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{row.comment || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 text-sm font-black uppercase tracking-[0.24em] text-gray-500">{t.accountingShared.totals}</td>
                                            <td className="px-4 py-3 text-right text-sm font-black text-amber-700">{formatBDT(debitTotal, { locale })}</td>
                                            <td className="px-4 py-3 text-right text-sm font-black text-sky-700">{formatBDT(creditTotal, { locale })}</td>
                                            <td className="px-4 py-3 text-right text-sm font-black text-gray-700">{t.accountingShared.balanced}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    </>
                ) : null}
            </div>
        </div>
    );
}

function DetailStat({ label, value }: { label: string; value: string }) {
    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">{label}</p>
            <p className="mt-2 text-lg font-black tracking-tight text-gray-900">{value}</p>
        </section>
    );
}