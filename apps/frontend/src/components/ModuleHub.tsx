'use client';

import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

export interface HubLinkConfig {
    href: string;
    key: string;
    icon: LucideIcon;
    accent: string;
    advancedOnly?: boolean;
}

export interface HubSectionConfig {
    sectionKey: string;
    advancedOnly?: boolean;
    links: HubLinkConfig[];
}

interface HubLinkCopy {
    title: string;
    description: string;
}

interface ModuleHubProps {
    moduleLabel: string;
    title: string;
    subtitle: string;
    sections: HubSectionConfig[];
    sectionLabels: Record<string, string>;
    linkCopy: Record<string, HubLinkCopy>;
    openSectionLabel: string;
    viewReportLabel: string;
    canAccessAdvanced?: boolean;
}

export default function ModuleHub({
    moduleLabel,
    title,
    subtitle,
    sections,
    sectionLabels,
    linkCopy,
    openSectionLabel,
    viewReportLabel,
    canAccessAdvanced = true,
}: ModuleHubProps) {
    const visibleSections = sections
        .filter((section) => !section.advancedOnly || canAccessAdvanced)
        .map((section) => ({
            label: sectionLabels[section.sectionKey] ?? section.sectionKey,
            links: section.links
                .filter((link) => !link.advancedOnly || canAccessAdvanced)
                .flatMap(({ href, key, icon, accent }) => {
                    const copy = linkCopy[key];
                    if (!copy) return [];
                    return [{
                        href,
                        title: copy.title,
                        description: copy.description,
                        icon,
                        accent,
                        isReport: section.sectionKey === 'reports',
                    }];
                }),
        }))
        .filter((section) => section.links.length > 0);

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1200px] mx-auto space-y-8">
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">{moduleLabel}</p>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-950">{title}</h1>
                        <p className="text-sm text-gray-500 max-w-3xl mt-2">{subtitle}</p>
                    </div>
                </div>

                {visibleSections.map((section) => (
                    <div key={section.label} className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">{section.label}</p>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {section.links.map(({ href, title: linkTitle, description, icon: Icon, accent, isReport }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className={`inline-flex rounded-2xl border px-3 py-3 ${accent}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="mt-5 space-y-2">
                                        <h2 className="text-lg font-black tracking-tight text-gray-950">{linkTitle}</h2>
                                        <p className="text-sm leading-6 text-gray-500">{description}</p>
                                    </div>
                                    <div className="mt-5 flex items-center text-sm font-bold text-gray-900">
                                        {isReport ? viewReportLabel : openSectionLabel}
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}