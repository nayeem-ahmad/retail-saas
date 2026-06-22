import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../../lib/api';
import { Search, Plus } from 'lucide-react';

interface ProductSearchProps {
    onProductSelect: (product: any) => void;
}

export default function ProductSearch({ onProductSelect }: ProductSearchProps) {
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const searchProducts = async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setProducts([]);
            return;
        }

        try {
            setLoading(true);
            const data = await api.searchProductsByQuantity(searchQuery, 20);
            setProducts(data || []);
        } catch (error) {
            console.error('Failed to search products', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) searchProducts(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                inputRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectProduct = (product: any) => {
        onProductSelect(product);
        setQuery('');
        setShowDropdown(false);
    };

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Add product — search by name, SKU, or code…"
                className="w-full pl-8 pr-3 py-1.5 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Results Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 border rounded bg-white shadow-lg z-50 max-h-80 overflow-y-auto"
                >
                    {loading ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
                    ) : query.trim().length < 2 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                            Type at least 2 characters to search
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">No products found</div>
                    ) : (
                        products.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center gap-2"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm truncate">{product.name}</div>
                                    <div className="text-xs text-gray-600">
                                        SKU: {product.sku || 'N/A'} | ৳{product.price?.toFixed(2)}
                                        {product.qty_sold > 0 && (
                                            <span className="text-green-600 ml-2">⭐ {product.qty_sold} sold</span>
                                        )}
                                        {product.subgroup && (
                                            <span className="text-gray-400 ml-2">{product.group?.name} → {product.subgroup.name}</span>
                                        )}
                                    </div>
                                </div>
                                <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
