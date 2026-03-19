'use client';

import { create } from 'zustand';

export interface TablePreferences {
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    columnWidths: Record<string, number>;
    pageSize: number;
}

interface TablePreferencesState {
    tables: Record<string, TablePreferences>;
    getPreferences: (tableId: string) => TablePreferences | undefined;
    setColumnVisibility: (tableId: string, visibility: Record<string, boolean>) => void;
    setColumnOrder: (tableId: string, order: string[]) => void;
    setColumnWidth: (tableId: string, columnId: string, width: number) => void;
    setPageSize: (tableId: string, pageSize: number) => void;
}

const STORAGE_KEY = 'data-table-preferences';

function loadFromStorage(): Record<string, TablePreferences> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveToStorage(tables: Record<string, TablePreferences>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    } catch {
        // Storage full or unavailable — silently ignore
    }
}

export const useTablePreferences = create<TablePreferencesState>((set, get) => ({
    tables: loadFromStorage(),

    getPreferences: (tableId) => get().tables[tableId],

    setColumnVisibility: (tableId, visibility) => {
        set((state) => {
            const updated = {
                ...state.tables,
                [tableId]: { ...state.tables[tableId], columnVisibility: visibility },
            };
            saveToStorage(updated);
            return { tables: updated };
        });
    },

    setColumnOrder: (tableId, order) => {
        set((state) => {
            const updated = {
                ...state.tables,
                [tableId]: { ...state.tables[tableId], columnOrder: order },
            };
            saveToStorage(updated);
            return { tables: updated };
        });
    },

    setColumnWidth: (tableId, columnId, width) => {
        set((state) => {
            const existing = state.tables[tableId]?.columnWidths ?? {};
            const updated = {
                ...state.tables,
                [tableId]: {
                    ...state.tables[tableId],
                    columnWidths: { ...existing, [columnId]: width },
                },
            };
            saveToStorage(updated);
            return { tables: updated };
        });
    },

    setPageSize: (tableId, pageSize) => {
        set((state) => {
            const updated = {
                ...state.tables,
                [tableId]: { ...state.tables[tableId], pageSize },
            };
            saveToStorage(updated);
            return { tables: updated };
        });
    },
}));
