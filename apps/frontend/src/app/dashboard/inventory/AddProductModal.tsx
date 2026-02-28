'use client';

import { useState } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { api } from '../../../lib/api';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (product: any) => void;
}

export default function AddProductModal({ isOpen, onClose, onAdd }: AddProductModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        initialStock: '',
        image_url: '',
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { url } = await api.uploadFile(file);
            setFormData({ ...formData, image_url: url });
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd({
                ...formData,
                price: parseFloat(formData.price),
                initialStock: parseInt(formData.initialStock) || 0,
            });
            setFormData({ name: '', sku: '', price: '', initialStock: '', image_url: '' });
            onClose();
        } catch (error) {
            console.error('Failed to add product', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Add New Product</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        {/* Image Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-6 h-6 text-gray-400 mx-auto" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Upload</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Product Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g., Wireless Mechanical Keyboard"
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">SKU</label>
                                <input
                                    type="text"
                                    placeholder="WH-KB-1032"
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Sale Price ($)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    placeholder="120.00"
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/10 transition-all font-bold"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Initial Stock Level</label>
                            <input
                                required
                                type="number"
                                placeholder="50"
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/10 transition-all font-bold"
                                value={formData.initialStock}
                                onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading || uploading}
                            type="submit"
                            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {loading ? 'Creating Product...' : 'Confirm & Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
