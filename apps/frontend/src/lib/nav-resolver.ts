import type { LucideIcon } from 'lucide-react';
import {
    NAV_REGISTRY,
    NavNodeKind,
    type NavLayoutNode,
    type NavRegistryEntry,
} from '@erp71/shared-types';
import { resolveNavIcon } from './nav-icons';

export interface ResolvedNavLink {
    href: string;
    icon: LucideIcon;
    label: string;
    section?: boolean;
    advancedOnly?: boolean;
    premiumOnly?: boolean;
    exact?: boolean;
}

export interface ResolvedNavSubgroup {
    type: 'subgroup';
    key: string;
    icon: LucideIcon;
    label: string;
    advancedOnly?: boolean;
    children: ResolvedNavLink[];
}

export type ResolvedNavChild = ResolvedNavLink | ResolvedNavSubgroup;

export interface ResolvedNavModule {
    key: string;
    icon: LucideIcon;
    label: string;
    href?: string;
    children?: ResolvedNavChild[];
    soon?: boolean;
    moduleKey?: string;
    platformFeature?: 'help' | 'support';
}

function resolveLabel(messages: Record<string, unknown>, labelKey: string): string {
    const value = labelKey.split('.').reduce<unknown>((acc, part) => {
        if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, messages);

    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'title' in (value as Record<string, unknown>)) {
        const title = (value as { title?: unknown }).title;
        if (typeof title === 'string') return title;
    }
    return labelKey;
}

function buildChildren(
    parentId: string,
    layout: NavLayoutNode[],
    messages: Record<string, unknown>,
): ResolvedNavChild[] {
    const children = layout
        .filter((node) => node.parentId === parentId && node.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return children.flatMap((node) => {
        const entry = NAV_REGISTRY[node.id];
        if (!entry) return [];

        if (entry.kind === NavNodeKind.SUBGROUP) {
            const subgroupChildren = buildChildren(node.id, layout, messages).filter(
                (child): child is ResolvedNavLink => !('type' in child),
            );
            if (subgroupChildren.length === 0) return [];
            return [{
                type: 'subgroup' as const,
                key: node.id.split('.').pop() ?? node.id,
                icon: resolveNavIcon(entry.icon),
                label: resolveLabel(messages, entry.labelKey),
                advancedOnly: entry.advancedOnly,
                children: subgroupChildren,
            }];
        }

        if (entry.kind !== NavNodeKind.LINK || !entry.href) return [];

        return [{
            href: entry.href,
            icon: resolveNavIcon(entry.icon),
            label: resolveLabel(messages, entry.labelKey),
            exact: entry.exact,
            advancedOnly: entry.advancedOnly,
            premiumOnly: entry.premiumOnly,
        }];
    });
}

export function buildNavModulesFromLayout(
    layout: NavLayoutNode[],
    messages: Record<string, unknown>,
): ResolvedNavModule[] {
    const roots = layout
        .filter((node) => node.parentId === null && node.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return roots.flatMap((node) => {
        const entry = NAV_REGISTRY[node.id];
        if (!entry) return [];

        const icon = resolveNavIcon(entry.icon);
        const label = resolveLabel(messages, entry.labelKey);

        if (entry.kind === NavNodeKind.MODULE && entry.href) {
            return [{
                key: node.id,
                icon,
                label,
                href: entry.href,
                moduleKey: entry.moduleKey,
                platformFeature: entry.platformFeature,
                soon: entry.soon,
            }];
        }

        if (entry.kind === NavNodeKind.MODULE) {
            const children = buildChildren(node.id, layout, messages);
            return [{
                key: node.id,
                icon,
                label,
                children,
                moduleKey: entry.moduleKey,
                platformFeature: entry.platformFeature,
                soon: entry.soon,
            }];
        }

        return [];
    });
}

export function getRegistryEntry(id: string): NavRegistryEntry | undefined {
    return NAV_REGISTRY[id];
}