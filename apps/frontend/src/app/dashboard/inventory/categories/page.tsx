'use client';

import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { FolderTree, Plus, Tag, Trash2, Pencil, X } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { api } from '../../../../lib/api';

interface ProductGroup {
    id: string;
    name: string;
    description?: string | null;
    _count?: { subgroups?: number; products?: number };
}

interface ProductSubgroup {
    id: string;
    name: string;
    description?: string | null;
    group_id: string;
    group?: { id: string; name: string } | null;
    _count?: { products?: number };
}

const groupColumnHelper = createColumnHelper<ProductGroup>();
const subgroupColumnHelper = createColumnHelper<ProductSubgroup>();

export default function InventoryCategoriesPage() {
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [subgroups, setSubgroups] = useState<ProductSubgroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupFormOpen, setGroupFormOpen] = useState(false);
    const [subgroupFormOpen, setSubgroupFormOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
    const [editingSubgroup, setEditingSubgroup] = useState<ProductSubgroup | null>(null);

    useEffect(() => {
        void refreshAll();
    }, []);

    const refreshAll = async () => {
        setLoading(true);
        try {
            const [groupData, subgroupData] = await Promise.all([api.getProductGroups(), api.getProductSubgroups()]);
            setGroups(groupData);
            setSubgroups(subgroupData);
        } catch (error) {
            console.error('Failed to load inventory categories', error);
        } finally {
            setLoading(false);
        }
    };

    const groupColumns: ColumnDef<ProductGroup, any>[] = useMemo(
        () => [
            groupColumnHelper.accessor('name', {
                header: 'Group',
                cell: (info) => (
                    <div>
                        <span className="block text-sm font-black text-gray-900">{info.row.original.name}</span>
                        <span className="block text-xs text-gray-400">{info.row.original.description || 'No description'}</span>
                    </div>
                ),
                size: 220,
            }),
            groupColumnHelper.accessor((row) => row._count?.subgroups ?? 0, {
                id: 'subgroups',
                header: 'Subgroups',
                cell: (info) => <span className="text-sm font-bold text-gray-700">{info.getValue()}</span>,
                size: 100,
            }),
            groupColumnHelper.accessor((row) => row._count?.products ?? 0, {
                id: 'products',
                header: 'Products',
                cell: (info) => <span className="text-sm font-bold text-gray-700">{info.getValue()}</span>,
                size: 100,
            }),
            groupColumnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: (info) => (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => {
                                setEditingGroup(info.row.original);
                                setGroupFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => void handleDeleteGroup(info.row.original.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ),
                enableSorting: false,
                size: 100,
            }),
        ],
        [],
    );

    const subgroupColumns: ColumnDef<ProductSubgroup, any>[] = useMemo(
        () => [
            subgroupColumnHelper.accessor('name', {
                header: 'Subgroup',
                cell: (info) => (
                    <div>
                        <span className="block text-sm font-black text-gray-900">{info.row.original.name}</span>
                        <span className="block text-xs text-gray-400">{info.row.original.description || 'No description'}</span>
                    </div>
                ),
                size: 220,
            }),
            subgroupColumnHelper.accessor((row) => row.group?.name || '-', {
                id: 'group',
                header: 'Parent Group',
                cell: (info) => <span className="text-sm font-bold text-gray-700">{info.getValue()}</span>,
                size: 170,
            }),
            subgroupColumnHelper.accessor((row) => row._count?.products ?? 0, {
                id: 'products',
                header: 'Products',
                cell: (info) => <span className="text-sm font-bold text-gray-700">{info.getValue()}</span>,
                size: 100,
            }),
            subgroupColumnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: (info) => (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={() => {
                                setEditingSubgroup(info.row.original);
                                setSubgroupFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => void handleDeleteSubgroup(info.row.original.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ),
                enableSorting: false,
                size: 100,
            }),
        ],
        [],
    );

    const handleDeleteGroup = async (id: string) => {
        if (!window.confirm('Delete this group?')) return;
        try {
            await api.deleteProductGroup(id);
            await refreshAll();
        } catch (error: any) {
            window.alert(error.message || 'Failed to delete product group.');
        }
    };

    const handleDeleteSubgroup = async (id: string) => {
        if (!window.confirm('Delete this subgroup?')) return;
        try {
            await api.deleteProductSubgroup(id);
            await refreshAll();
        } catch (error: any) {
            window.alert(error.message || 'Failed to delete product subgroup.');
        }
    };

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Product Categories</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            Organize products into groups and subgroups for cleaner inventory browsing and reporting
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setEditingSubgroup(null);
                                setSubgroupFormOpen(true);
                            }}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center"
                        >
                            <Tag className="w-4 h-4 mr-2" />
                            New Subgroup
                        </button>
                        <button
                            onClick={() => {
                                setEditingGroup(null);
                                setGroupFormOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Group
                        </button>
                    </div>
                </div>

                {groupFormOpen && (
                    <ProductGroupForm
                        group={editingGroup}
                        onCancel={() => {
                            setEditingGroup(null);
                            setGroupFormOpen(false);
                        }}
                        onSaved={async () => {
                            setEditingGroup(null);
                            setGroupFormOpen(false);
                            await refreshAll();
                        }}
                    />
                )}

                {subgroupFormOpen && (
                    <ProductSubgroupForm
                        groups={groups}
                        subgroup={editingSubgroup}
                        onCancel={() => {
                            setEditingSubgroup(null);
                            setSubgroupFormOpen(false);
                        }}
                        onSaved={async () => {
                            setEditingSubgroup(null);
                            setSubgroupFormOpen(false);
                            await refreshAll();
                        }}
                    />
                )}

                <DataTable<ProductGroup>
                    tableId="product-groups"
                    columns={groupColumns}
                    data={groups}
                    title="Product Groups"
                    isLoading={loading}
                    emptyMessage="No product groups found"
                    emptyIcon={<FolderTree className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search groups..."
                />

                <DataTable<ProductSubgroup>
                    tableId="product-subgroups"
                    columns={subgroupColumns}
                    data={subgroups}
                    title="Product Subgroups"
                    isLoading={loading}
                    emptyMessage="No product subgroups found"
                    emptyIcon={<Tag className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search subgroups..."
                />
            </div>
        </div>
    );
}

function ProductGroupForm({
    group,
    onCancel,
    onSaved,
}: {
    group: ProductGroup | null;
    onCancel: () => void;
    onSaved: () => Promise<void>;
}) {
    const [name, setName] = useState(group?.name ?? '');
    const [description, setDescription] = useState(group?.description ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = { name, description: description || undefined };
            if (group) {
                await api.updateProductGroup(group.id, payload);
            } else {
                await api.createProductGroup(payload);
            }
            await onSaved();
        } catch (err: any) {
            setError(err.message || 'Failed to save product group.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm">{group ? 'Edit Product Group' : 'New Product Group'}</h3>
                <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                    <X className="w-4 h-4" />
                </button>
            </div>
            {error ? <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold mb-4">{error}</div> : null}
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[220px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm font-bold" />
                </div>
                <div className="flex-1 min-w-[260px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Description</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm" />
                </div>
                <button disabled={loading} type="submit" className="px-6 py-2.5 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                    {loading ? 'Saving...' : group ? 'Update Group' : 'Create Group'}
                </button>
            </form>
        </div>
    );
}

function ProductSubgroupForm({
    groups,
    subgroup,
    onCancel,
    onSaved,
}: {
    groups: ProductGroup[];
    subgroup: ProductSubgroup | null;
    onCancel: () => void;
    onSaved: () => Promise<void>;
}) {
    const [groupId, setGroupId] = useState(subgroup?.group_id ?? groups[0]?.id ?? '');
    const [name, setName] = useState(subgroup?.name ?? '');
    const [description, setDescription] = useState(subgroup?.description ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = { groupId, name, description: description || undefined };
            if (subgroup) {
                await api.updateProductSubgroup(subgroup.id, payload);
            } else {
                await api.createProductSubgroup(payload);
            }
            await onSaved();
        } catch (err: any) {
            setError(err.message || 'Failed to save product subgroup.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm">{subgroup ? 'Edit Product Subgroup' : 'New Product Subgroup'}</h3>
                <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                    <X className="w-4 h-4" />
                </button>
            </div>
            {error ? <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold mb-4">{error}</div> : null}
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                <div className="min-w-[220px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Parent Group</label>
                    <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm font-bold">
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[220px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm font-bold" />
                </div>
                <div className="flex-1 min-w-[260px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Description</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm" />
                </div>
                <button disabled={loading} type="submit" className="px-6 py-2.5 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                    {loading ? 'Saving...' : subgroup ? 'Update Subgroup' : 'Create Subgroup'}
                </button>
            </form>
        </div>
    );
}