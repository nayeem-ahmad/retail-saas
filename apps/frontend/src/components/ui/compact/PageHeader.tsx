'use client';

import type { ReactNode } from 'react';
import { compactDensity } from '@/lib/ui/compact-density';
import type { BreadcrumbItem } from '@/lib/page-breadcrumbs';
import PageBreadcrumb from './PageBreadcrumb';

type PageHeaderProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
    className?: string;
};

/** Page title block — title/subtitle on the left, breadcrumb (and optional actions) on the right. */
export default function PageHeader({
    title,
    subtitle,
    breadcrumbs,
    actions,
    className = '',
}: PageHeaderProps) {
    const hasBreadcrumbs = Boolean(breadcrumbs?.length);
    const hasActions = Boolean(actions);

    if (!title && !subtitle && !hasBreadcrumbs && !hasActions) return null;

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                    {title ? (
                        <h1 className={compactDensity.pageTitle}>{title}</h1>
                    ) : null}
                    {subtitle ? (
                        <p className={`${compactDensity.pageSubtitle} mt-0.5`}>{subtitle}</p>
                    ) : null}
                </div>

                {(hasBreadcrumbs || hasActions) ? (
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 min-w-0">
                        {hasBreadcrumbs ? <PageBreadcrumb items={breadcrumbs!} /> : null}
                        {hasActions ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                {actions}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}