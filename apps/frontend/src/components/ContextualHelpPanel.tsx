'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ContextualHelpContent } from '@/lib/help/contextual-help';

type ContextualHelpPanelProps = ContextualHelpContent;

export function ContextualHelpPanel({
    panelKey,
    title,
    summary,
    steps,
    learnMoreHref,
}: ContextualHelpPanelProps) {
    const [dismissed, setDismissed] = useState(false);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        if (globalThis.window === undefined) return;
        setDismissed(localStorage.getItem(panelKey) === '1');
        setExpanded(localStorage.getItem(panelKey) !== '1');
    }, [panelKey]);

    const dismiss = () => {
        localStorage.setItem(panelKey, '1');
        setDismissed(true);
    };

    if (dismissed) {
        return (
            <button
                type="button"
                onClick={() => {
                    localStorage.removeItem(panelKey);
                    setDismissed(false);
                    setExpanded(true);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
                <BookOpen className="w-3.5 h-3.5" />
                Show {title.toLowerCase()}
            </button>
        );
    }

    return (
        <section className="rounded-2xl border border-blue-100 bg-blue-50/70 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-700 flex-shrink-0">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-blue-950">{title}</h2>
                        <p className="text-sm text-blue-900/80 mt-1 leading-relaxed">{summary}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => setExpanded((value) => !value)}
                        className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                        aria-label={expanded ? 'Collapse help' : 'Expand help'}
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={dismiss}
                        className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                        aria-label="Dismiss help"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="px-5 pb-4 border-t border-blue-100/80">
                    <ol className="mt-4 space-y-2 list-decimal list-inside text-sm text-blue-950/90 leading-relaxed">
                        {steps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                    {learnMoreHref ? (
                        <p className="mt-4 text-xs">
                            <Link href={learnMoreHref} className="font-bold text-blue-700 hover:text-blue-900 hover:underline">
                                More in Help Center →
                            </Link>
                        </p>
                    ) : null}
                </div>
            )}
        </section>
    );
}