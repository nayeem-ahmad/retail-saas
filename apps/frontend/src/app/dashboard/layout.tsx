'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        api.getMe().then(setUser).catch(() => null);
    }, []);

    const isDashboardHome = pathname === '/dashboard';
    const activeTenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;
    const activeTenant = user?.tenants?.find((tenant: any) => tenant.id === activeTenantId) || user?.tenants?.[0];
    const primaryRole = activeTenant?.role;
    const hasPremiumPlan = activeTenant?.subscription?.is_premium;
    const activePlanCode = activeTenant?.subscription?.plan?.code || null;
    const isPlatformAdmin = Boolean(user?.is_platform_admin);
    const canManageBilling = primaryRole === 'OWNER' || primaryRole === 'MANAGER';
    const canAccessAccounting = (primaryRole === 'OWNER' || primaryRole === 'MANAGER') && hasPremiumPlan;
    const canAccessInventoryReports = Boolean(hasPremiumPlan);

    useEffect(() => {
        if (!canAccessAccounting && pathname.startsWith('/dashboard/accounting')) {
            router.replace('/dashboard');
        }
        if (!canAccessInventoryReports && pathname.startsWith('/dashboard/inventory/reports')) {
            router.replace('/dashboard/inventory');
        }
        if (!isPlatformAdmin && pathname.startsWith('/dashboard/admin')) {
            router.replace('/dashboard');
        }
    }, [canAccessAccounting, canAccessInventoryReports, isPlatformAdmin, pathname, router]);

    // Build a human-readable page title from the path
    const pageTitle = (() => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length <= 1) return 'Dashboard';
        const last = segments[segments.length - 1];
        // If it looks like a UUID / id segment, step up one
        const isId = /^[0-9a-f-]{8,}$/i.test(last);
        const label = isId ? segments[segments.length - 2] : last;
        return label
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    })();

    return (
        <div className="flex h-screen bg-[#f9fafb] font-sans text-[#111827]">
            <Sidebar
                canAccessAccounting={canAccessAccounting}
                canAccessInventoryReports={canAccessInventoryReports}
                canAccessAdmin={isPlatformAdmin}
                canManageBilling={canManageBilling}
                activePlanCode={activePlanCode}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top header */}
                <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        {!isDashboardHome ? (
                            <button
                                onClick={() => router.back()}
                                className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-900 transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                <span className="text-sm font-semibold">Back</span>
                            </button>
                        ) : null}
                        {!isDashboardHome && (
                            <span className="text-gray-300 text-sm select-none">·</span>
                        )}
                        <span className="text-sm font-bold text-gray-700 tracking-tight">{pageTitle}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="h-8 w-px bg-gray-200" />
                        <div className="flex items-center space-x-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold tracking-tight leading-none">{user?.name || '—'}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                    {activeTenant?.role || 'Staff'}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-black border border-blue-200 cursor-pointer hover:scale-105 transition-transform">
                                {user?.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
