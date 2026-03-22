'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Settings2, Warehouse } from 'lucide-react';
import { api } from '../../../../lib/api';

export default function InventorySettingsPage() {
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [reasons, setReasons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<any>({});
    const [message, setMessage] = useState('');
    const [warehouseForm, setWarehouseForm] = useState<any>({ storeId: '', name: '', code: '', isDefault: false });
    const [reasonForm, setReasonForm] = useState<any>({ type: 'SHRINKAGE', code: '', label: '' });

    useEffect(() => {
        void loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [warehouseData, settingsData, reasonData] = await Promise.all([
                api.getInventoryWarehouses(),
                api.getInventorySettings(),
                api.getInventoryReasons(),
            ]);
            setWarehouses(warehouseData);
            setReasons(reasonData);
            setForm({
                defaultProductWarehouseId: settingsData.defaultProductWarehouse?.id || '',
                defaultPurchaseWarehouseId: settingsData.defaultPurchaseWarehouse?.id || '',
                defaultSalesWarehouseId: settingsData.defaultSalesWarehouse?.id || '',
                defaultShrinkageWarehouseId: settingsData.defaultShrinkageWarehouse?.id || '',
                defaultTransferSourceWarehouseId: settingsData.defaultTransferSourceWarehouse?.id || '',
                defaultTransferDestinationWarehouseId: settingsData.defaultTransferDestinationWarehouse?.id || '',
                defaultReorderLevel: settingsData.default_reorder_level ?? 10,
                defaultSafetyStock: settingsData.default_safety_stock ?? 0,
                defaultLeadTimeDays: settingsData.default_lead_time_days ?? 0,
                discrepancyApprovalThreshold: settingsData.discrepancy_approval_threshold ?? 25,
            });
            setWarehouseForm((current: any) => ({ ...current, storeId: warehouseData[0]?.store_id || '' }));
        } catch (error) {
            console.error('Failed to load inventory settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await api.updateInventorySettings({
                ...form,
                defaultReorderLevel: Number(form.defaultReorderLevel),
                defaultSafetyStock: Number(form.defaultSafetyStock),
                defaultLeadTimeDays: Number(form.defaultLeadTimeDays),
                discrepancyApprovalThreshold: Number(form.discrepancyApprovalThreshold),
            });
            setMessage('Inventory settings updated.');
            await loadAll();
        } catch (error: any) {
            setMessage(error.message || 'Failed to save inventory settings.');
        }
    };

    const handleCreateWarehouse = async () => {
        try {
            await api.createInventoryWarehouse({
                storeId: warehouseForm.storeId,
                name: warehouseForm.name,
                code: warehouseForm.code || undefined,
                isDefault: warehouseForm.isDefault,
            });
            setMessage('Warehouse created.');
            setWarehouseForm({ storeId: warehouseForm.storeId, name: '', code: '', isDefault: false });
            await loadAll();
        } catch (error: any) {
            setMessage(error.message || 'Failed to create warehouse.');
        }
    };

    const handleToggleWarehouse = async (warehouse: any) => {
        try {
            await api.updateInventoryWarehouse(warehouse.id, {
                isActive: !warehouse.is_active,
            });
            setMessage('Warehouse updated.');
            await loadAll();
        } catch (error: any) {
            setMessage(error.message || 'Failed to update warehouse.');
        }
    };

    const handleSetDefaultWarehouse = async (warehouse: any) => {
        try {
            await api.updateInventoryWarehouse(warehouse.id, { isDefault: true });
            setMessage('Warehouse default updated.');
            await loadAll();
        } catch (error: any) {
            setMessage(error.message || 'Failed to set warehouse default.');
        }
    };

    const handleCreateReason = async () => {
        try {
            await api.createInventoryReason(reasonForm);
            setMessage('Inventory reason created.');
            setReasonForm({ type: 'SHRINKAGE', code: '', label: '' });
            await loadAll();
        } catch (error: any) {
            setMessage(error.message || 'Failed to create inventory reason.');
        }
    };

    const handleToggleReason = async (reason: any) => {
        try {
            await api.updateInventoryReason(reason.id, { isActive: !reason.is_active });
            setMessage('Inventory reason updated.');
            await loadAll();
        } catch (error: any) {
            setMessage(error.message || 'Failed to update inventory reason.');
        }
    };

    if (loading) {
        return <div className="p-6 text-sm text-gray-500">Loading inventory settings…</div>;
    }

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1100px] mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Inventory Settings</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            Configure warehouse defaults, alert thresholds, and adjustment reason catalogs
                        </p>
                    </div>
                    <button onClick={() => void handleSave()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200">
                        <Save className="w-4 h-4 mr-2" /> Save Changes
                    </button>
                </div>

                {message ? <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700">{message}</div> : null}

                <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-blue-600" />
                        <h2 className="font-black text-lg">Warehouse Defaults</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            ['defaultProductWarehouseId', 'Product Creation Warehouse'],
                            ['defaultPurchaseWarehouseId', 'Purchase Receipt Warehouse'],
                            ['defaultSalesWarehouseId', 'Sales Issue Warehouse'],
                            ['defaultShrinkageWarehouseId', 'Shrinkage Warehouse'],
                            ['defaultTransferSourceWarehouseId', 'Transfer Source Warehouse'],
                            ['defaultTransferDestinationWarehouseId', 'Transfer Destination Warehouse'],
                        ].map(([key, label]) => (
                            <div key={key}>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">{label}</label>
                                <select value={form[key]} onChange={(e) => setForm((current: any) => ({ ...current, [key]: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium">
                                    <option value="">Select warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-blue-600" />
                        <h2 className="font-black text-lg">Warehouses</h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                        <input value={warehouseForm.storeId} onChange={(e) => setWarehouseForm((current: any) => ({ ...current, storeId: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" placeholder="Store ID" />
                        <input value={warehouseForm.name} onChange={(e) => setWarehouseForm((current: any) => ({ ...current, name: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" placeholder="Warehouse name" />
                        <input value={warehouseForm.code} onChange={(e) => setWarehouseForm((current: any) => ({ ...current, code: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" placeholder="Optional code" />
                        <button onClick={() => void handleCreateWarehouse()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-200">
                            <Plus className="w-4 h-4 mr-2" /> Add Warehouse
                        </button>
                    </div>
                    <div className="grid gap-3">
                        {warehouses.map((warehouse) => (
                            <div key={warehouse.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 gap-4">
                                <div>
                                    <div className="text-sm font-black text-gray-900">{warehouse.name}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{warehouse.code} • {warehouse.is_default ? 'Default' : 'Secondary'} • {warehouse.is_active ? 'Active' : 'Inactive'}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!warehouse.is_default ? <button onClick={() => void handleSetDefaultWarehouse(warehouse)} className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold">Make Default</button> : null}
                                    <button onClick={() => void handleToggleWarehouse(warehouse)} className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold">{warehouse.is_active ? 'Deactivate' : 'Activate'}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                    <h2 className="font-black text-lg">Alert Rules</h2>
                    <div className="grid md:grid-cols-4 gap-4">
                        {[
                            ['defaultReorderLevel', 'Default Reorder Level'],
                            ['defaultSafetyStock', 'Default Safety Stock'],
                            ['defaultLeadTimeDays', 'Default Lead Time Days'],
                            ['discrepancyApprovalThreshold', 'Discrepancy Approval Threshold'],
                        ].map(([key, label]) => (
                            <div key={key}>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">{label}</label>
                                <input type="number" value={form[key]} onChange={(e) => setForm((current: any) => ({ ...current, [key]: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                    <h2 className="font-black text-lg">Reason Catalog</h2>
                    <div className="grid md:grid-cols-4 gap-4">
                        <select value={reasonForm.type} onChange={(e) => setReasonForm((current: any) => ({ ...current, type: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium">
                            <option value="SHRINKAGE">Shrinkage</option>
                            <option value="DISCREPANCY">Discrepancy</option>
                        </select>
                        <input value={reasonForm.code} onChange={(e) => setReasonForm((current: any) => ({ ...current, code: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" placeholder="Reason code" />
                        <input value={reasonForm.label} onChange={(e) => setReasonForm((current: any) => ({ ...current, label: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium" placeholder="Reason label" />
                        <button onClick={() => void handleCreateReason()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-200">
                            <Plus className="w-4 h-4 mr-2" /> Add Reason
                        </button>
                    </div>
                    <div className="grid gap-3">
                        {reasons.map((reason) => (
                            <div key={reason.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                <div>
                                    <div className="text-sm font-black text-gray-900">{reason.label}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{reason.type} • {reason.code}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-bold text-gray-400">{reason.is_system ? 'System' : reason.is_active ? 'Active' : 'Inactive'}</div>
                                    {!reason.is_system ? <button onClick={() => void handleToggleReason(reason)} className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold">{reason.is_active ? 'Deactivate' : 'Activate'}</button> : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}