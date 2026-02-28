'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, MoreVertical, Edit2, Trash2, ArrowUpRight, Clock } from 'lucide-react';
import { api } from '../../../lib/api';
import AddProductModal from './AddProductModal';

export default function InventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (productData: any) => {
        try {
            await api.createProduct(productData);
            loadProducts();
        } catch (error) {
            console.error('Error adding product', error);
            throw error;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#f9fafb] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Manage your products and stock levels</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </button>
            </div>

            <AddProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddProduct}
            />

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <SummaryCard title="Total Products" value={products.length.toString()} icon={<Package className="text-blue-600" />} />
                <SummaryCard title="Stock Value" value="$45,200" icon={<ArrowUpRight className="text-emerald-600" />} />
                <SummaryCard title="Out of Stock" value="3" icon={<Trash2 className="text-rose-600" />} color="rose" />
                <SummaryCard title="Low Stock" value="12" icon={<Filter className="text-amber-600" />} color="amber" />
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by SKU, Name..."
                            className="bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-full focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                    <div className="flex space-x-3">
                        <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                <th className="px-6 py-4">Product Name</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Current Stock</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">Loading inventory...</td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">No products found. Start by adding one.</td>
                                </tr>
                            ) : products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg group-hover:scale-110 transition-transform"></div>
                                            <span className="font-bold text-sm text-gray-900 tracking-tight">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{product.sku || 'N/A'}</td>
                                    <td className="px-6 py-4 font-bold text-sm">${product.price}</td>
                                    <td className="px-6 py-4 font-bold text-sm">{product.stocks?.[0]?.quantity || 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${(product.stocks?.[0]?.quantity || 0) > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {(product.stocks?.[0]?.quantity || 0) > 10 ? 'In Stock' : 'Low Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-600 p-1">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon, color = 'blue' }: { title: string, value: string, icon: React.ReactNode, color?: string }) {
    const colorClasses: any = {
        blue: 'bg-blue-50/50',
        rose: 'bg-rose-50/50',
        amber: 'bg-amber-50/50',
    };
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-all hover:shadow-md">
            <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">{title}</p>
                <h3 className="text-xl font-black tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
