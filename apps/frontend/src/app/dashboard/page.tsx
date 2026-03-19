'use client';

import {
    Package,
    TrendingUp,
    TrendingDown,
    Clock,
    MoreVertical,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [meRes, productsRes, salesRes] = await Promise.all([
                    api.getMe(),
                    api.getProducts(),
                    api.getSales()
                ]);
                setUser(meRes);
                setProducts(productsRes);
                setSales(salesRes);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalSalesAmount = sales.reduce((acc, sale) => acc + Number(sale.total_amount), 0);
    const activeOrdersCount = sales.length;
    const displayedProducts = products.slice(0, 4);

    return (
        <div className="overflow-y-auto h-full p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">
                    {user?.tenants?.[0]?.name || 'Your Business'} • Last updated: Today
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Sales"
                    value={`$${totalSalesAmount.toLocaleString()}`}
                    trend="+0% from last month"
                    isPositive={true}
                />
                <StatCard
                    title="Active Orders"
                    value={activeOrdersCount.toString()}
                    trend="Real-time data"
                    isPositive={true}
                />
                <StatCard
                    title="Products"
                    value={products.length.toString()}
                    trend="In inventory"
                    isPositive={true}
                />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 tracking-tight">Recent Activity</h2>
                        <button className="text-gray-400 hover:text-gray-600 font-medium text-sm">
                            View all
                        </button>
                    </div>
                    <div className="p-0">
                        {sales.length > 0 ? (
                            sales.slice(0, 5).map((sale) => (
                                <ActivityItem
                                    key={sale.id}
                                    title={`Sale ${sale.serial_number}`}
                                    description={`Amount: $${Number(sale.total_amount).toFixed(2)}`}
                                    time={new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                />
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
                        )}
                    </div>
                </div>

                {/* Inventory Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-gray-900 tracking-tight">Inventory Overview</h2>
                        <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer" />
                    </div>
                    <div className="space-y-6">
                        {displayedProducts.length > 0 ? (
                            displayedProducts.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    name={product.name}
                                    price={`$${Number(product.price).toFixed(2)}`}
                                    sales={product.stocks?.[0]?.quantity?.toString() || '0'}
                                    salesLabel="Stock"
                                />
                            ))
                        ) : (
                            <div className="text-center text-gray-400 text-sm py-4">No products found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, trend, isPositive }: { title: string, value: string, trend: string, isPositive: boolean }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
            <p className="text-gray-500 font-semibold text-xs uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight mb-4">{value}</h3>
            <div className={`flex items-center space-x-1 text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="uppercase tracking-tight">{trend}</span>
            </div>
        </div>
    );
}

function ActivityItem({ title, description, time }: { title: string, description: string, time: string }) {
    return (
        <div className="px-6 py-4 flex items-start space-x-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer group">
            <div className="mt-1 h-3 w-3 rounded-full flex-shrink-0 animate-pulse bg-blue-400" />
            <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 tracking-tight">{title}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{description}</p>
            </div>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter self-center whitespace-nowrap group-hover:text-gray-600 transition-colors">
                <Clock className="w-3 h-3" />
                <span>{time}</span>
            </div>
        </div>
    );
}

function ProductRow({ name, price, sales, salesLabel = 'Sales' }: { name: string, price: string, sales: string, salesLabel?: string }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg group-hover:scale-110 transition-transform" />
                <div>
                    <p className="text-sm font-bold text-gray-900 tracking-tight">{name}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-tight">{price}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold tracking-tight">{sales}</p>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{salesLabel}</p>
            </div>
        </div>
    );
}

