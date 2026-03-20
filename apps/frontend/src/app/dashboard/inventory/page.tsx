'use client';

import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api';
import AddProductModal from './AddProductModal';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';

interface Product {
    id: string;
    name: string;
    sku?: string | null;
    price: string | number;
    image_url?: string | null;
    stocks?: { quantity: number | string }[];
}

const columnHelper = createColumnHelper<Product>();

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
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

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.deleteProduct(id);
            setProducts((prev) => prev.filter((product) => product.id !== id));
        } catch (error: any) {
            alert(error.message || 'Failed to delete product');
        }
    };

    const columns: ColumnDef<Product, any>[] = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: 'Product',
                cell: (info) => {
                    const product = info.row.original;
                    return (
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-[10px] font-black text-gray-500 uppercase">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    product.name.slice(0, 2)
                                )}
                            </div>
                            <span className="text-sm font-black text-gray-900">{product.name}</span>
                        </div>
                    );
                },
                size: 240,
            }),
            columnHelper.accessor('sku', {
                header: 'SKU',
                cell: (info) => (
                    <span className="text-sm font-mono text-gray-500">{info.getValue() || '-'}</span>
                ),
                size: 150,
            }),
            columnHelper.accessor('price', {
                header: 'Price',
                cell: (info) => (
                    <span className="text-sm font-black text-blue-600">
                        ${Number(info.getValue() || 0).toFixed(2)}
                    </span>
                ),
                sortingFn: (a, b) => Number(a.getValue('price') || 0) - Number(b.getValue('price') || 0),
                size: 120,
            }),
            columnHelper.accessor((row) => Number(row.stocks?.[0]?.quantity || 0), {
                id: 'stock',
                header: 'Current Stock',
                cell: (info) => (
                    <span className="text-sm font-bold text-gray-700">{info.getValue()}</span>
                ),
                sortingFn: (a, b) => Number(a.getValue('stock')) - Number(b.getValue('stock')),
                size: 120,
            }),
            columnHelper.accessor(
                (row) => Number(row.price || 0) * Number(row.stocks?.[0]?.quantity || 0),
                {
                    id: 'stock_value',
                    header: 'Stock Value',
                    cell: (info) => (
                        <span className="text-sm font-bold text-gray-700">
                            ${Number(info.getValue() || 0).toFixed(2)}
                        </span>
                    ),
                    sortingFn: (a, b) => Number(a.getValue('stock_value')) - Number(b.getValue('stock_value')),
                    size: 130,
                },
            ),
            columnHelper.accessor(
                (row) => {
                    const quantity = Number(row.stocks?.[0]?.quantity || 0);
                    if (quantity === 0) return 'OUT';
                    if (quantity <= 10) return 'LOW';
                    return 'IN';
                },
                {
                    id: 'status',
                    header: 'Status',
                    cell: (info) => {
                        const status = info.getValue();
                        const classes =
                            status === 'OUT'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : status === 'LOW'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        const label = status === 'OUT' ? 'Out of Stock' : status === 'LOW' ? 'Low Stock' : 'In Stock';

                        return (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${classes}`}>
                                {label}
                            </span>
                        );
                    },
                    size: 130,
                },
            ),
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: (info) => (
                    <div className="flex items-center justify-end space-x-1">
                        <button
                            onClick={() => handleDelete(info.row.original.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ),
                enableSorting: false,
                enableColumnFilter: false,
                enableResizing: false,
                size: 90,
            }),
        ],
        [],
    );

    const filterPresets = useMemo(
        () => [
            { label: 'In Stock', filters: [{ id: 'status', value: 'IN' }] },
            { label: 'Low Stock', filters: [{ id: 'status', value: 'LOW' }] },
            { label: 'Out of Stock', filters: [{ id: 'status', value: 'OUT' }] },
        ],
        [],
    );

    return (
        <div className="overflow-y-auto h-full bg-[#f3f4f6] p-6 font-sans text-gray-900">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Products</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                            Manage catalog pricing and stock positions
                        </p>
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

                <DataTable<Product>
                    tableId="products"
                    columns={columns}
                    data={products}
                    title="Products"
                    isLoading={loading}
                    emptyMessage="No products found"
                    emptyIcon={<Package className="w-16 h-16 text-gray-200" />}
                    searchPlaceholder="Search by product, SKU, stock status..."
                    filterPresets={filterPresets}
                    enableRowSelection
                />
            </div>
        </div>
    );
}
