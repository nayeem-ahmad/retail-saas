'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Plus, MapPin, Pencil, Trash2, X, Users, ChevronRight } from 'lucide-react';

export default function TerritoriesPage() {
    const [territories, setTerritories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTerritory, setEditingTerritory] = useState<any>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => { loadTerritories(); }, []);

    const loadTerritories = async () => {
        try {
            const data = await api.getTerritories();
            setTerritories(data);
        } catch (error) {
            console.error('Failed to load territories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        if (editingTerritory) {
            await api.updateTerritory(editingTerritory.id, data);
        } else {
            await api.createTerritory(data);
        }
        setIsFormOpen(false);
        setEditingTerritory(null);
        loadTerritories();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this territory?')) return;
        try {
            await api.deleteTerritory(id);
            loadTerritories();
        } catch (err: any) {
            alert(err.message || 'Cannot delete territory with children or assigned customers.');
        }
    };

    const openEdit = (territory: any) => {
        setEditingTerritory(territory);
        setIsFormOpen(true);
    };

    const openCreate = () => {
        setEditingTerritory(null);
        setIsFormOpen(true);
    };

    // Organize into a tree structure for display
    const rootTerritories = territories.filter(t => !t.parent_id);
    const childrenOf = (parentId: string) => territories.filter(t => t.parent_id === parentId);

    return (
        <div className="overflow-y-auto h-full p-8 bg-[#f9fafb]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Territories</h1>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Geographic hierarchy for customers</p>
                </div>
                <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5">
                    <Plus className="w-4 h-4 mr-2" /> New Territory
                </button>
            </div>

            {isFormOpen && (
                <TerritoryForm
                    territory={editingTerritory}
                    territories={territories}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditingTerritory(null); }}
                />
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs py-12">Loading...</p>
                ) : territories.length === 0 ? (
                    <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs py-12">No territories yet. Create one!</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {rootTerritories.map(territory => (
                            <TerritoryRow key={territory.id} territory={territory} depth={0} childrenOf={childrenOf} onEdit={openEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TerritoryRow({ territory, depth, childrenOf, onEdit, onDelete }: {
    territory: any; depth: number; childrenOf: (id: string) => any[]; onEdit: (t: any) => void; onDelete: (id: string) => void;
}) {
    const children = childrenOf(territory.id);
    const [expanded, setExpanded] = useState(true);

    return (
        <>
            <div className="flex items-center px-6 py-4 hover:bg-gray-50/50 transition-colors" style={{ paddingLeft: `${24 + depth * 28}px` }}>
                {children.length > 0 ? (
                    <button onClick={() => setExpanded(!expanded)} className="mr-2 p-0.5 hover:bg-gray-100 rounded text-gray-400">
                        <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                ) : (
                    <span className="w-5 mr-2" />
                )}
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                    <span className="font-black text-sm">{territory.name}</span>
                    {territory.description && <span className="text-xs text-gray-400 ml-2">{territory.description}</span>}
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-500 text-xs">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        <span className="font-bold">{territory._count?.customers ?? 0}</span>
                    </div>
                    {children.length > 0 && (
                        <span className="text-xs text-gray-400 font-medium">{children.length} sub</span>
                    )}
                    <button onClick={() => onEdit(territory)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(territory.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            {expanded && children.map(child => (
                <TerritoryRow key={child.id} territory={child} depth={depth + 1} childrenOf={childrenOf} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </>
    );
}

function TerritoryForm({ territory, territories, onSave, onCancel }: {
    territory: any; territories: any[]; onSave: (d: any) => Promise<void>; onCancel: () => void;
}) {
    const [name, setName] = useState(territory?.name || '');
    const [parentId, setParentId] = useState(territory?.parent_id || '');
    const [description, setDescription] = useState(territory?.description || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Exclude self and descendants to prevent circular references
    const availableParents = territories.filter(t => t.id !== territory?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload: any = { name };
            if (parentId) payload.parent_id = parentId;
            if (description) payload.description = description;
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
                <h3 className="font-black text-sm">{territory ? 'Edit Territory' : 'New Territory'}</h3>
                <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 font-black text-sm focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Dhaka" />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Parent Territory <span className="text-gray-300">(Optional)</span></label>
                    <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 font-bold text-gray-600 text-sm focus:ring-2 focus:ring-blue-500/20">
                        <option value="">None (Root)</option>
                        {availableParents.map(t => (
                            <option key={t.id} value={t.id}>{t.parent ? `${t.parent.name} > ` : ''}{t.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Description <span className="text-gray-300">(Optional)</span></label>
                    <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 font-bold text-gray-600 text-sm focus:ring-2 focus:ring-blue-500/20" placeholder="Description" />
                </div>
                <button disabled={loading} type="submit" className="px-6 py-2.5 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : territory ? 'Update' : 'Create'}
                </button>
            </form>
        </div>
    );
}
