'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package, Trash2, Plus, Minus, CreditCard, ChevronRight, Store } from 'lucide-react';
import { api } from '../../../lib/api';

export default function POSPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const addToCart = (product: any) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax mock
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            const saleData = {
                storeId: localStorage.getItem('store_id') || '',
                totalAmount: total,
                amountPaid: total,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    priceAtSale: parseFloat(item.price),
                })),
            };
            await api.createSale(saleData);
            alert('Sale completed successfully!');
            setCart([]);
            loadProducts(); // Update stock levels
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Checkout failed. Please check stock levels.');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-[#f3f4f6] font-sans text-gray-900 overflow-hidden">
            {/* Left Section: Product Selection */}
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">POS Terminal</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Quick selection & billing</p>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search SKU or Name..."
                            className="w-full bg-white border-none rounded-xl py-2.5 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Products...</div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white p-4 rounded-3xl shadow-sm border border-transparent hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer transition-all group flex flex-col items-center text-center space-y-3"
                                >
                                    <div className="w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        ) : (
                                            <Package className="w-8 h-8 text-gray-200" />
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <h3 className="text-sm font-black tracking-tight text-gray-900 truncate">{product.name}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-2">{product.sku || 'N/A'}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-lg font-black text-blue-600">${product.price}</span>
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-gray-500">
                                                {product.stocks?.[0]?.quantity || 0} left
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Section: Cart & Checkout */}
            <div className="w-[400px] bg-white border-l border-gray-100 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-black tracking-tight">Current Cart</h2>
                    </div>
                    <span className="bg-gray-900 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {cart.length} Items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                            <ShoppingCart className="w-16 h-16 opacity-20" />
                            <p className="text-xs font-black uppercase tracking-widest">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="bg-gray-50/50 p-4 rounded-2xl flex items-center space-x-4 group border border-transparent hover:border-blue-500/10 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                                <div className="w-12 h-12 bg-white rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-5 h-5 text-gray-200" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-black tracking-tight text-gray-900 leading-tight">{item.name}</h4>
                                    <p className="text-xs font-bold text-blue-600 mt-0.5">${item.price}</p>
                                </div>
                                <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-blue-600 transition-colors"><Minus className="w-4 h-4" /></button>
                                    <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-blue-600 transition-colors"><Plus className="w-4 h-4" /></button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Tax (10%)</span>
                            <span className="text-gray-900">${tax.toFixed(2)}</span>
                        </div>
                        <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between">
                            <span className="text-sm font-black uppercase tracking-widest">Total Pay</span>
                            <span className="text-2xl font-black text-blue-600">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-gray-900 hover:bg-blue-600 text-white py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-200 flex items-center justify-center group transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-20 disabled:grayscale disabled:translate-y-0"
                    >
                        <CreditCard className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                        Complete Checkout
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
