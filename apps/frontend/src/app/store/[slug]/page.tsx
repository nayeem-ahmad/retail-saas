'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, X, Plus, Minus, Package, AlertCircle, CheckCircle, Search, Menu, Mail } from 'lucide-react';
import { formatBDT } from '@/lib/format';
import Link from 'next/link';

const API_BASE =
    (process.env.NEXT_PUBLIC_API_BASE ||
        (process.env.NODE_ENV === 'production'
            ? 'https://retail-saas-backend.onrender.com'
            : 'http://localhost:4000')) + '/api/v1';

interface Product {
    id: string;
    name: string;
    selling_price: string | number;
    image_url: string | null;
    stock_quantity: number;
    group_name?: string;
}

interface Category {
    id: string;
    name: string;
    count: number;
}

interface StorefrontData {
    tenant: {
        name: string;
        storefront_banner: string | null;
    };
    categories: Category[];
    trending_products: Product[];
    all_products: Product[];
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function StorefrontPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [data, setData] = useState<StorefrontData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Checkout form
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        fetch(`${API_BASE}/storefront/${slug}`)
            .then(async (res) => {
                if (!res.ok) {
                    setNotFound(true);
                    return;
                }
                const json = await res.json();
                setData('data' in json ? json.data : json);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product.id === product.id
                        ? { ...i, quantity: Math.min(i.quantity + 1, product.stock_quantity) }
                        : i,
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((i) => i.product.id !== productId));
    };

    const updateQty = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((i) =>
                    i.product.id === productId
                        ? { ...i, quantity: i.quantity + delta }
                        : i,
                )
                .filter((i) => i.quantity > 0),
        );
    };

    const cartTotal = cart.reduce((total, item) => {
        return total + Number(item.product.selling_price) * item.quantity;
    }, 0);

    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setOrderError(null);

        try {
            const res = await fetch(`${API_BASE}/storefront/${slug}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    customerEmail,
                    customerPhone: customerPhone || undefined,
                    notes: notes || undefined,
                    items: cart.map((i) => ({
                        productId: i.product.id,
                        quantity: i.quantity,
                    })),
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || 'Failed to place order');
            }

            setOrderSuccess(json.data?.id || json.id || 'SUCCESS');
            setCart([]);
            setCheckoutOpen(false);
            setCustomerName('');
            setCustomerEmail('');
            setCustomerPhone('');
            setNotes('');
        } catch (err: any) {
            setOrderError(err.message || 'An error occurred during checkout');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium">Loading store...</p>
                </div>
            </div>
        );
    }

    if (notFound || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Store Not Found</h1>
                    <p className="text-gray-500">This store doesn't exist or is currently unavailable.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-black selection:text-white">
            {/* Top promotional banner */}
            {data.tenant.storefront_banner && (
                <div className="bg-black text-white text-center py-2 px-4 text-sm tracking-wide">
                    {data.tenant.storefront_banner}
                </div>
            )}

            {/* Navigation */}
            <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 -ml-2 text-gray-600">
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center justify-center md:justify-start flex-1 md:flex-none">
                            <Link href={`/store/${slug}`} className="text-2xl font-black tracking-tighter">
                                {data.tenant.name}
                            </Link>
                        </div>

                        {/* Desktop Links */}
                        <nav className="hidden md:flex space-x-8">
                            <Link href="#" className="text-gray-900 hover:text-gray-600 font-medium transition-colors">Home</Link>
                            <Link href="#" className="text-gray-500 hover:text-gray-900 font-medium transition-colors">Shop</Link>
                            <Link href="#" className="text-gray-500 hover:text-gray-900 font-medium transition-colors">Collections</Link>
                            <Link href="#" className="text-gray-500 hover:text-gray-900 font-medium transition-colors">Contact</Link>
                        </nav>

                        {/* Cart Button */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative p-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Success message */}
            {orderSuccess && (
                <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-green-800">Order placed successfully!</p>
                            <p className="text-green-700 text-sm mt-0.5">
                                Order ID: <span className="font-mono font-bold">{orderSuccess}</span>
                            </p>
                            <button
                                onClick={() => setOrderSuccess(null)}
                                className="text-xs text-green-600 underline mt-1 font-medium hover:text-green-800"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main>
                {/* Hero Section */}
                <section className="relative bg-gray-100 py-32 lg:py-48 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80" 
                            alt="Storefront Hero" 
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40 mix-blend-multiply" />
                    </div>
                    
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 drop-shadow-sm">
                            New Season Arrivals
                        </h1>
                        <p className="mt-4 text-xl md:text-2xl text-gray-200 max-w-2xl font-light mb-10 drop-shadow">
                            Discover the latest trends and elevate your style with our carefully curated collection.
                        </p>
                        <button className="bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 transform transition-all duration-200 px-10 py-4 rounded-full font-bold text-lg shadow-xl">
                            Shop Now
                        </button>
                    </div>
                </section>

                {/* Categories Section */}
                {data.categories && data.categories.length > 0 && (
                    <section className="py-20 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-end mb-10">
                                <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
                                <Link href="#" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center group">
                                    View All <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                </Link>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {data.categories.map((category, index) => {
                                    // Use distinct placeholder images for categories
                                    const images = [
                                        "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=400&h=400",
                                        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400&h=400",
                                        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400&h=400",
                                        "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=400&h=400"
                                    ];
                                    
                                    return (
                                        <div key={category.id} className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                                            <img 
                                                src={images[index % images.length]} 
                                                alt={category.name} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                            <div className="absolute bottom-6 left-6 right-6">
                                                <h3 className="text-2xl font-bold text-white mb-1">{category.name}</h3>
                                                <p className="text-gray-300 font-medium">{category.count} products</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Trending Now Section */}
                <section className="py-20 bg-gray-50 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-end mb-10">
                            <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
                            <Link href="#" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center group">
                                View All <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>

                        {(!data.trending_products || data.trending_products.length === 0) ? (
                            <div className="text-center py-16 text-gray-400">
                                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium">No trending products available yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {data.trending_products.map((product) => {
                                    const cartItem = cart.find((i) => i.product.id === product.id);
                                    const inCart = !!cartItem;
                                    
                                    return (
                                        <div key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                            <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                                {/* Badge Mock */}
                                                {Math.random() > 0.5 && (
                                                    <div className="absolute top-4 left-4 z-10 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full tracking-wide shadow-sm">
                                                        {Math.random() > 0.5 ? 'New' : 'Sale'}
                                                    </div>
                                                )}
                                                
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                        <Package className="w-12 h-12 text-gray-300" />
                                                    </div>
                                                )}
                                                
                                                {/* Quick Add Overlay */}
                                                <div className="absolute bottom-4 left-4 right-4 translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                                    <button 
                                                        onClick={() => addToCart(product)}
                                                        disabled={product.stock_quantity <= 0}
                                                        className="w-full bg-black/90 backdrop-blur text-white font-semibold py-3 rounded-xl hover:bg-black transition-colors disabled:bg-gray-400"
                                                    >
                                                        {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="text-sm text-gray-500 mb-1.5 font-medium">{product.group_name || 'Category'}</div>
                                                <h3 className="font-bold text-gray-900 leading-snug mb-2 line-clamp-2">
                                                    {product.name}
                                                </h3>
                                                
                                                {/* Rating Mock */}
                                                <div className="flex items-center space-x-1 mb-3 mt-auto">
                                                    <span className="text-yellow-400">★</span>
                                                    <span className="text-sm font-semibold">4.8</span>
                                                    <span className="text-sm text-gray-400">(124)</span>
                                                </div>
                                                
                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                                    <span className="font-black text-lg">{formatBDT(Number(product.selling_price))}</span>
                                                    
                                                    {/* Original Price Mock */}
                                                    {Math.random() > 0.5 && (
                                                        <span className="text-sm text-gray-400 line-through">
                                                            {formatBDT(Number(product.selling_price) * 1.2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div className="mt-16 text-center">
                            <Link href="#" className="inline-block border-2 border-black text-black hover:bg-black hover:text-white font-bold py-4 px-10 rounded-full transition-colors duration-300">
                                View All Products
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Newsletter Section */}
                <section className="py-24 bg-white border-t border-gray-100">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Join Our Newsletter</h2>
                        <p className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto">
                            Subscribe to receive updates, access to exclusive deals, and more.
                        </p>
                        <form className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3">
                            <input 
                                type="email" 
                                placeholder="Enter your email address" 
                                className="flex-1 rounded-full border border-gray-300 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                            <button type="button" className="bg-black text-white hover:bg-gray-800 font-bold py-4 px-8 rounded-full transition-colors">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2">
                            <Link href="#" className="text-2xl font-black tracking-tighter mb-6 block">
                                {data.tenant.name}
                            </Link>
                            <p className="text-gray-400 max-w-md leading-relaxed">
                                Curating the best products for your lifestyle. Quality, style, and excellent customer service guaranteed.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-lg mb-6">Shop</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><Link href="#" className="hover:text-white transition-colors">All Products</Link></li>
                                {data.categories?.slice(0, 3).map((c) => (
                                    <li key={c.id}><Link href="#" className="hover:text-white transition-colors">{c.name}</Link></li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-lg mb-6">Customer Service</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Shipping Info</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Returns</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-gray-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
                        <p>© {new Date().getFullYear()} {data.tenant.name}. All rights reserved.</p>
                        <p className="mt-4 md:mt-0">Powered by <span className="font-semibold text-white">StoreCraft</span></p>
                    </div>
                </div>
            </footer>

            {/* Cart Sidebar */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setCartOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl transform transition-transform">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold flex items-center space-x-2">
                                <ShoppingCart className="w-5 h-5" />
                                <span>Your Cart ({cartCount})</span>
                            </h2>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <ShoppingCart className="w-16 h-16 opacity-20" />
                                    <p className="text-lg">Your cart is empty</p>
                                    <button 
                                        onClick={() => setCartOpen(false)}
                                        className="mt-4 border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-2 rounded-full font-medium transition-colors"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                <ul className="space-y-6">
                                    {cart.map((item) => (
                                        <li key={item.product.id} className="flex space-x-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            {item.product.image_url ? (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="w-20 h-20 rounded-lg object-cover bg-gray-50"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                                    <Package className="w-8 h-8 text-gray-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-gray-900 leading-tight pr-4">
                                                        {item.product.name}
                                                    </h3>
                                                    <button
                                                        onClick={() => removeFromCart(item.product.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 mt-1">
                                                    {formatBDT(Number(item.product.selling_price))}
                                                </p>
                                                <div className="mt-auto pt-3 flex items-center space-x-3">
                                                    <button
                                                        onClick={() => updateQty(item.product.id, -1)}
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-sm font-semibold w-4 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQty(item.product.id, 1)}
                                                        disabled={item.quantity >= item.product.stock_quantity}
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600 disabled:opacity-50 disabled:hover:bg-gray-100"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Subtotal</span>
                                    <span>{formatBDT(cartTotal)}</span>
                                </div>
                                <p className="text-sm text-gray-500 text-center">
                                    Shipping and taxes calculated at checkout.
                                </p>
                                <button
                                    onClick={() => {
                                        setCartOpen(false);
                                        setCheckoutOpen(true);
                                    }}
                                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-black/10"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {checkoutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setCheckoutOpen(false)}
                    />
                    <div className="relative bg-white rounded-2xl w-full max-w-lg z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold tracking-tight">Checkout</h2>
                            <button onClick={() => setCheckoutOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1">
                            <form id="checkout-form" onSubmit={handleCheckout} className="p-6 space-y-5">
                                {/* Order summary mini */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Summary</h3>
                                    <div className="space-y-2">
                                        {cart.map((item) => (
                                            <div key={item.product.id} className="flex justify-between text-sm text-gray-700">
                                                <span className="flex-1 pr-4 truncate">
                                                    {item.quantity} × {item.product.name}
                                                </span>
                                                <span className="font-semibold whitespace-nowrap">
                                                    {formatBDT(Number(item.product.selling_price) * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between text-base font-bold text-gray-900">
                                        <span>Total</span>
                                        <span className="text-blue-600">{formatBDT(cartTotal)}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Customer Details</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Jane Doe"
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="jane@example.com"
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Phone (optional)
                                        </label>
                                        <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            placeholder="+880 1..."
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Delivery Notes (optional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Special instructions for delivery..."
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 bg-white">
                            {orderError && (
                                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3 mb-4 flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{orderError}</span>
                                </p>
                            )}
                            
                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-blue-600/20 text-lg"
                            >
                                {submitting ? 'Processing...' : `Pay ${formatBDT(cartTotal)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
