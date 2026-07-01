'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, ChevronDown } from 'lucide-react';
import { HelpTooltip } from '@/components/HelpTooltip';
import { ACCOUNTING_CORE_LINKS, ACCOUNTING_REPORT_LINKS } from '@/lib/accounting-nav';
import { api } from '@/lib/api';
import { useI18n, formatMessage } from '@/lib/i18n';

type ExportFormat = 'tally' | 'quickbooks';

function getDefaultDateRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const from = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
}

function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

export default function AccountingPage() {
    const { t, locale } = useI18n();
    const defaults = getDefaultDateRange();

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);
    const [from, setFrom] = useState(defaults.from);
    const [to, setTo] = useState(defaults.to);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const exportMenuRef = useRef<HTMLDivElement>(null);

    const accountingLinks = useMemo(
        () => ACCOUNTING_CORE_LINKS.map(({ href, key, icon, accent }) => ({
            href,
            title: t.accounting.links[key].title,
            description: t.accounting.links[key].description,
            icon,
            accent,
        })),
        [t],
    );

    const reportLinks = useMemo(
        () => ACCOUNTING_REPORT_LINKS.map(({ href, key, icon, accent }) => ({
            href,
            title: t.accounting.links[key].title,
            description: t.accounting.links[key].description,
            icon,
            accent,
        })),
        [t],
    );

    function openExportModal(format: ExportFormat) {
        setPendingFormat(format);
        setShowExportMenu(false);
        setExportError(null);
        setShowDateModal(true);
    }

    async function handleExport() {
        if (!pendingFormat) return;
        setExporting(true);
        setExportError(null);
        try {
            const { blob, filename } = await api.exportAccountingLedger({
                format: pendingFormat,
                from: from || undefined,
                to: to || undefined,
            });
            triggerBlobDownload(blob, filename);
            setShowDateModal(false);
        } catch (err: any) {
            setExportError(err?.message ?? t.accountingShared.exportFailed);
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1200px] mx-auto space-y-6">
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">{t.accounting.moduleLabel}</p>
                    <div className="flex items-end justify-between gap-6 flex-wrap">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-950 inline-flex items-center gap-2">{t.accounting.title} <HelpTooltip text={t.accounting.titleHelp} /></h1>
                            <p className="text-sm text-gray-500 max-w-3xl mt-2">
                                {t.accounting.subtitle}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Export dropdown */}
                            <div className="relative" ref={exportMenuRef}>
                                <button
                                    onClick={() => setShowExportMenu((v) => !v)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow"
                                >
                                    <Download className="h-4 w-4" />
                                    {t.accounting.export}
                                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                </button>
                                {showExportMenu && (
                                    <div
                                        className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                                        onMouseLeave={() => setShowExportMenu(false)}
                                    >
                                        <button
                                            onClick={() => openExportModal('tally')}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {t.accounting.tallyXml}
                                        </button>
                                        <button
                                            onClick={() => openExportModal('quickbooks')}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {t.accounting.quickbooksIif}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
                                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-500">{t.accounting.epicLabel}</p>
                                <p className="text-sm font-bold text-blue-900">{t.accounting.epicStatus}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {accountingLinks.map(({ href, title, description, icon: Icon, accent }) => (
                        <Link
                            key={title}
                            href={href}
                            className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className={`inline-flex rounded-2xl border px-3 py-3 ${accent}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="mt-5 space-y-2">
                                <h2 className="text-lg font-black tracking-tight text-gray-950">{title}</h2>
                                <p className="text-sm leading-6 text-gray-500">{description}</p>
                            </div>
                            <div className="mt-5 flex items-center text-sm font-bold text-gray-900">
                                {t.accountingShared.openSection}
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">{t.accounting.financialReports}</p>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {reportLinks.map(({ href, title, description, icon: Icon, accent }) => (
                            <Link
                                key={title}
                                href={href}
                                className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className={`inline-flex rounded-2xl border px-3 py-3 ${accent}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="mt-5 space-y-2">
                                    <h2 className="text-lg font-black tracking-tight text-gray-950">{title}</h2>
                                    <p className="text-sm leading-6 text-gray-500">{description}</p>
                                </div>
                                <div className="mt-5 flex items-center text-sm font-bold text-gray-900">
                                    {t.accountingShared.viewReport}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Date-range modal */}
            {showDateModal && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowDateModal(false); }}
                >
                    <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <h2 className="text-lg font-black tracking-tight text-gray-950 mb-1">
                            {formatMessage(t.accounting.exportModalTitle, {
                                format: pendingFormat === 'tally' ? t.accounting.tallyXml : t.accounting.quickbooksIif,
                            })}
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {t.accounting.exportModalDescription}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    {t.accountingShared.from}
                                </label>
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    {t.accountingShared.to}
                                </label>
                                <input
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {exportError && (
                            <p className="mt-3 text-sm text-red-600">{exportError}</p>
                        )}

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60 transition"
                            >
                                <Download className="h-4 w-4" />
                                {exporting ? t.accountingShared.downloading : t.accountingShared.download}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
