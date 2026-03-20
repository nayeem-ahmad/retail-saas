'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../lib/api';
import { Plus, FolderTree, Pencil, Trash2, X } from 'lucide-react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';

interface CustomerGroup {
    id: string;
    name: string;
    description?: string | null;
    default_discount_pct?: string | number | null;
    _count?: { customers?: number };
}

const columnHelper = createColumnHelper<CustomerGroup>();

export default function CustomerGroupsPage() {
    const [groups, setGroups] = useState<CustomerGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => { loadGroups(); }, []);

    const loadGroups = async () => {
        try {
            const data = await api.getCustomerGroups();
            setGroups(data);
        } catch (error) {
            console.error('Failed to load groups', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        if (editingGroup) {
            await api.updateCustomerGroup(editingGroup.id, data);
        } else {
            await api.createCustomerGroup(data);
        }
        setIsFormOpen(false);
        setEditingGroup(null);
        loadGroups();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this group? Customers in this group will be unassigned.')) return;
        try {
            await api.deleteCustomerGroup(id);
            loadGroups();
        } catch (err: any) {
            alert(err.message || 'Cannot delete group with assigned customers.');
        }
    };

    const openEdit = (group: any) => {
        setEditingGroup(group);
        setIsFormOpen(true);
    };

    const openCreate = () => {
        setEditingGroup(null);
        setIsFormOpen(true);
    };

    const columns: ColumnDef<CustomerGroup, any>[] = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: 'Group',
                cell: (info) => {
                    const group = info.row.original;
                    return (
                        <div>
                            <span className="block text-sm font-black text-gray-900">{group.name}</span>
                            <span className="block text-xs text-gray-400">{group.description || 'No description'}</span>
                        </div>
                    );
                },
                size: 240,
            }),
            columnHelper.accessor((row) => row._count?.customers ?? 0, {
                id: 'customers',
                header: 'Customers',
                cell: (info) => (
                    <span className="text-sm font-bold text-gray-700">{info.getValue()}</span>
                ),
                sortingFn: (a, b) => Number(a.getValue('customers')) - Number(b.getValue('customers')),
                size: 110,
            }),
            columnHelper.accessor('default_discount_pct', {
                header: 'Default Discount',
                cell: (info) => {
                    const value = Number(info.getValue() || 0);
                    return value > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-200">
                            {value}%
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">None</span>
                    );
                },
                sortingFn: (a, b) => Number(a.getValue('default_discount_pct') || 0) - Number(b.getValue('default_discount_pct') || 0),
                size: 140,
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: (info) => {
                    const group = info.row.original;
                    return (
                        <div className="flex items-center justify-end space-x-1">
                            <button
                                onClick={() => openEdit(group)}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                title="Edit"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(group.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                },
                enableSorting: false,
                enableColumnFilter: false,
                enableResizing: false,
                size: 110,
            }),
        ],
        [editingGroup],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Customer Groups</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            Organize customers with reusable pricing rules
                        </p>
                    </div>
                    <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        <Plus className="w-4 h-4 mr-2" /> New Group
                    </button>
                </div>

                {isFormOpen && (
                    <GroupForm
                        group={editingGroup}
                        onSave={handleSave}
                        onCancel={() => { setIsFormOpen(false); setEditingGroup(null); }}
                    />
                )}

                <DataTable<CustomerGroup>
                    tableId="customer-groups"
                    columns={columns}
                    data={groups}
                    title="Customer Groups"
                    isLoading={loading}
                    emptyMessage="No customer groups found"
                    emptyIcon={<FolderTree className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search by group name..."
                />
            </div>
        </div>
    );
}

function GroupForm({ group, onSave, onCancel }: { group: any; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
    const [name, setName] = useState(group?.name || '');
    const [description, setDescription] = useState(group?.description || '');
    const [discount, setDiscount] = useState(group?.default_discount_pct ? String(Number(group.default_discount_pct)) : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload: any = { name };
            if (description) payload.description = description;
            if (discount) payload.default_discount_pct = parseFloat(discount);
            await onSave(payload);
        } catch (err: any) {
            setError(err.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm">{group ? 'Edit Group' : 'New Group'}</h3>
                <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 font-black text-sm focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Wholesale" />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Description <span className="text-gray-300">(Optional)</span></label>
                    <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 font-bold text-gray-600 text-sm focus:ring-2 focus:ring-blue-500/20" placeholder="Group description" />
                </div>
                <div className="w-32">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Discount %</label>
                    <input type="number" min="0" max="100" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 font-bold text-gray-600 text-sm focus:ring-2 focus:ring-blue-500/20" placeholder="0" />
                </div>
                <button disabled={loading} type="submit" className="px-6 py-2.5 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : group ? 'Update' : 'Create'}
                </button>
            </form>
        </div>
    );
}
