'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/page-breadcrumbs';

type PageBreadcrumbProps = {
    items: BreadcrumbItem[];
    className?: string;
};

export default function PageBreadcrumb({ items, className = '' }: PageBreadcrumbProps) {
    if (items.length === 0) return null;

    return (
        <nav
            className={`flex flex-wrap items-center justify-end gap-1.5 text-sm text-gray-500 ${className}`}
            aria-label="Breadcrumb"
        >
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                        {index > 0 ? (
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
                        ) : null}
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className="font-semibold hover:text-gray-800 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? 'font-bold text-gray-800' : 'font-semibold'}>
                                {item.label}
                            </span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}