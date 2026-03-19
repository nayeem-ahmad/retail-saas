'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Plus, FolderTree, Pencil, Trash2, X, Users } from 'lucide-react';

export default function CustomerGroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGroup, setEditingGroup] = useState<any>(null);
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

    return (
        <div className="overflow-y-auto h-full p-8 bg-[#f9fafb]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customer Groups</h1>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Organize customers by group</p>
                </div>
                <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="col-span-full text-center text-gray-400 font-bold uppercase tracking-widest text-xs py-12">Loading...</p>
                ) : groups.length === 0 ? (
                    <p className="col-span-full text-center text-gray-400 font-bold uppercase tracking-widest text-xs py-12">No groups yet. Create one!</p>
                ) : groups.map(group => (
                    <div key={group.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <FolderTree className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm">{group.name}</h3>
                                    {group.description && <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>}
                                </div>
                            </div>
                            <div className="flex space-x-1">
                                <button onClick={() => openEdit(group)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(group.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-500">
                                <Users className="w-4 h-4 mr-1" />
                                <span className="font-bold">{group._count?.customers ?? 0}</span>
                                <span className="ml-1 text-xs">customers</span>
                            </div>
                            {group.default_discount_pct && Number(group.default_discount_pct) > 0 && (
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{Number(group.default_discount_pct)}% discount</span>
                            )}
                        </div>
                    </div>
                ))}
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
