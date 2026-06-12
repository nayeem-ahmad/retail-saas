'use client';

import Link from 'next/link';
import { FlaskConical, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type DemoSandboxBannerProps = {
    onDismiss: () => void;
};

export default function DemoSandboxBanner({ onDismiss }: DemoSandboxBannerProps) {
    const { t } = useI18n();

    return (
        <div className="bg-violet-600 text-white px-6 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                <FlaskConical className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.dashboardLayout.demoBannerMessage}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                    href="/signup"
                    className="text-xs font-bold bg-white text-violet-700 px-3 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                >
                    {t.dashboardLayout.demoBannerCta}
                </Link>
                <button
                    onClick={onDismiss}
                    className="text-violet-200 hover:text-white transition-colors"
                    aria-label="Dismiss demo banner"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}