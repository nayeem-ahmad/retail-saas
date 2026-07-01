'use client';

import { ShieldCheck } from 'lucide-react';
import SystemHealthPanel from '@/components/platform/SystemHealthPanel';
import { useI18n } from '@/lib/i18n';

export default function SystemHealthPage() {
    const { t } = useI18n();
    const m = t.admin.systemHealth;

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="w-full space-y-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{m.badge}</p>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">{m.title}</h1>
                    <p className="mt-1 text-sm text-gray-500">{m.description}</p>
                </div>

                <SystemHealthPanel />
            </div>
        </div>
    );
}