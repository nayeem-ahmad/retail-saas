'use client';

import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    Settings,
    LogOut,
    Bell,
    Search,
    TrendingUp,
    TrendingDown,
    Clock,
    MoreVertical,
    LinkIcon
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="flex h-screen bg-[#f9fafb] font-sans text-[#111827]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-10">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Package className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">RetailSaaS</span>
                    </div>

                    <nav className="space-y-1">
                        <NavItem href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" active />
                        <NavItem href="/dashboard/pos" icon={<ShoppingCart />} label="POS" />
                        <NavItem href="/dashboard/inventory" icon={<Package />} label="Inventory" />
                        <NavItem href="#" icon={<Users />} label="Customers" />
                        <div className="pt-10 pb-4">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-3">Management</span>
                        </div>
                        <NavItem icon={<Settings />} label="Settings" />
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-gray-100">
                    <button className="flex items-center space-x-3 w-full px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
                        <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-medium text-sm">Sign out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <div className="relative w-96 hidden lg:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search orders, products..."
                            className="bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-full focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-sm font-semibold uppercase tracking-tight">Alex Rivera</p>
                                <p className="text-xs text-gray-500 uppercase font-medium">Store Admin</p>
                            </div>
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200 shadow-sm transition-transform hover:scale-105 cursor-pointer">
                                AR
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                        <p className="text-gray-500 text-sm mt-1 uppercase font-medium tracking-wide">Last updated: Today, 10:45 AM</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            title="Total Sales"
                            value="$128,430"
                            trend="+12% from last month"
                            isPositive={true}
                        />
                        <StatCard
                            title="Active Orders"
                            value="1,240"
                            trend="+48 since yesterday"
                            isPositive={true}
                        />
                        <StatCard
                            title="Cart Rate"
                            value="3.42%"
                            trend="-0.5% from last week"
                            isPositive={false}
                        />
                    </div>

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 tracking-tight">Recent Activity</h2>
                                <button className="text-gray-400 hover:text-gray-600 font-medium text-sm flex items-center">
                                    View all
                                </button>
                            </div>
                            <div className="p-0">
                                <ActivityItem
                                    title="New Order #FR-9012"
                                    description="Processed for Emma Watson"
                                    time="12 mins ago"
                                />
                                <ActivityItem
                                    title="Inventory Alert"
                                    description="Product 'Minimalist Desk' low"
                                    time="2 hours ago"
                                    isWarning
                                />
                                <ActivityItem
                                    title="New Customer"
                                    description="Liam Neeson signed up"
                                    time="5 hours ago"
                                />
                                <ActivityItem
                                    title="System Update"
                                    description="Cloud sync completed"
                                    time="Yesterday"
                                />
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-gray-900 tracking-tight">Top Products</h2>
                                <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer" />
                            </div>
                            <div className="space-y-6">
                                <ProductRow name="Ergonomic Chair" price="$240" sales="154" />
                                <ProductRow name="Wireless Earbuds" price="$89" sales="142" />
                                <ProductRow name="Glass Desk Lamp" price="$55" sales="98" />
                                <ProductRow name="Mechanical Keyboard" price="$120" sales="75" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, href = '#', active = false }: { icon: React.ReactNode, label: string, href?: string, active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            <span className={`w-5 h-5 ${active ? 'text-white' : 'group-hover:scale-110 transition-transform'}`}>{icon}</span>
            <span className="font-semibold text-sm tracking-tight">{label}</span>
        </Link>
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

function ActivityItem({ title, description, time, isWarning = false }: { title: string, description: string, time: string, isWarning?: boolean }) {
    return (
        <div className="px-6 py-4 flex items-start space-x-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer group">
            <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 animate-pulse ${isWarning ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
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

function ProductRow({ name, price, sales }: { name: string, price: string, sales: string }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg group-hover:scale-110 transition-transform"></div>
                <div>
                    <p className="text-sm font-bold text-gray-900 tracking-tight">{name}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-tight">{price}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold tracking-tight">{sales}</p>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Sales</p>
            </div>
        </div>
    );
}
