'use client';

import { useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Eye, EyeOff } from 'lucide-react';
import {
    NAV_REGISTRY,
    NavNodeKind,
    type NavLayoutNode,
} from '@erp71/shared-types';

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

function getSiblings(layout: NavLayoutNode[], parentId: string | null): NavLayoutNode[] {
    return layout
        .filter((node) => node.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
}

function moveNode(layout: NavLayoutNode[], id: string, direction: -1 | 1): NavLayoutNode[] {
    const node = layout.find((entry) => entry.id === id);
    if (!node) return layout;

    const siblings = getSiblings(layout, node.parentId);
    const index = siblings.findIndex((entry) => entry.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return layout;

    const reordered = [...siblings];
    const [removed] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, removed);

    const orderMap = new Map(reordered.map((entry, sortOrder) => [entry.id, sortOrder]));
    return layout.map((entry) => (
        orderMap.has(entry.id)
            ? { ...entry, sortOrder: orderMap.get(entry.id)! }
            : entry
    ));
}

function toggleVisibility(layout: NavLayoutNode[], id: string): NavLayoutNode[] {
    return layout.map((node) => (
        node.id === id ? { ...node, visible: !node.visible } : node
    ));
}

function NavTreeNode({
    node,
    layout,
    messages,
    depth,
    expanded,
    onToggleExpand,
    onMove,
    onToggleVisibility,
}: {
    node: NavLayoutNode;
    layout: NavLayoutNode[];
    messages: Record<string, unknown>;
    depth: number;
    expanded: Record<string, boolean>;
    onToggleExpand: (id: string) => void;
    onMove: (id: string, direction: -1 | 1) => void;
    onToggleVisibility: (id: string) => void;
}) {
    const entry = NAV_REGISTRY[node.id];
    const children = getSiblings(layout, node.id);
    const hasChildren = children.length > 0;
    const isOpen = expanded[node.id] ?? depth < 1;
    const siblings = getSiblings(layout, node.parentId);
    const index = siblings.findIndex((entry) => entry.id === node.id);

    if (!entry) return null;

    const label = resolveLabel(messages, entry.labelKey);
    const kindLabel = entry.kind === NavNodeKind.MODULE
        ? 'Module'
        : entry.kind === NavNodeKind.SUBGROUP
            ? 'Subgroup'
            : 'Link';

    return (
        <div>
            <div
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    node.visible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'
                }`}
                style={{ marginLeft: depth * 16 }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={() => onToggleExpand(node.id)}
                        className="text-gray-400 hover:text-gray-700"
                        aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                ) : (
                    <span className="w-4" />
                )}

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{label}</p>
                    <p className="truncate text-[11px] text-gray-400">{kindLabel} · {node.id}</p>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onMove(node.id, -1)}
                        disabled={index <= 0}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                        aria-label="Move up"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove(node.id, 1)}
                        disabled={index < 0 || index >= siblings.length - 1}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                        aria-label="Move down"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggleVisibility(node.id)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label={node.visible ? 'Hide item' : 'Show item'}
                    >
                        {node.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {hasChildren && isOpen && (
                <div className="mt-1 space-y-1">
                    {children.map((child) => (
                        <NavTreeNode
                            key={child.id}
                            node={child}
                            layout={layout}
                            messages={messages}
                            depth={depth + 1}
                            expanded={expanded}
                            onToggleExpand={onToggleExpand}
                            onMove={onMove}
                            onToggleVisibility={onToggleVisibility}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NavLayoutEditor({
    layout,
    messages,
    expanded,
    onLayoutChange,
    onToggleExpand,
}: {
    layout: NavLayoutNode[];
    messages: Record<string, unknown>;
    expanded: Record<string, boolean>;
    onLayoutChange: (next: NavLayoutNode[]) => void;
    onToggleExpand: (id: string) => void;
}) {
    const roots = useMemo(() => getSiblings(layout, null), [layout]);

    return (
        <div className="space-y-1">
            {roots.map((node) => (
                <NavTreeNode
                    key={node.id}
                    node={node}
                    layout={layout}
                    messages={messages}
                    depth={0}
                    expanded={expanded}
                    onToggleExpand={onToggleExpand}
                    onMove={(id, direction) => onLayoutChange(moveNode(layout, id, direction))}
                    onToggleVisibility={(id) => onLayoutChange(toggleVisibility(layout, id))}
                />
            ))}
        </div>
    );
}