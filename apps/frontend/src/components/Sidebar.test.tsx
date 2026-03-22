'use client';

import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

jest.mock('next/link', () => {
    return ({ children, href, className, title }: { children: React.ReactNode; href: string; className?: string; title?: string }) => (
        <a href={href} className={className} title={title}>{children}</a>
    );
});

jest.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/accounting',
}));

jest.mock('lucide-react', () => {
    const icon = () => <span data-testid="icon" />;
    return {
        LayoutDashboard: icon,
        ShoppingCart: icon,
        Package: icon,
        Users: icon,
        FileText: icon,
        ClipboardList: icon,
        ArrowLeftRight: icon,
        Undo2: icon,
        TrendingUp: icon,
        Clock: icon,
        Settings: icon,
        LogOut: icon,
        ChevronLeft: icon,
        ChevronRight: icon,
        ChevronDown: icon,
        ShoppingBag: icon,
        Truck: icon,
        Calculator: icon,
        FolderTree: icon,
        MapPin: icon,
        ClipboardCheck: icon,
        AlertTriangle: icon,
        BookOpen: icon,
        ShieldCheck: icon,
        CreditCard: icon,
        Crown: icon,
    };
});

describe('Sidebar — Story 30.1', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('shows accounting navigation when access is allowed', () => {
        render(<Sidebar canAccessAccounting />);

        expect(screen.getByText('Accounting')).toBeInTheDocument();
    });

    it('hides accounting navigation when access is not allowed', () => {
        render(<Sidebar canAccessAccounting={false} />);

        expect(screen.queryByText('Accounting')).not.toBeInTheDocument();
    });

    it('shows platform admin and billing items when enabled', () => {
        render(<Sidebar canAccessAccounting canAccessAdmin canManageBilling activePlanCode="PREMIUM" />);

        expect(screen.getByText('Billing')).toBeInTheDocument();
        expect(screen.getByText('Platform Admin')).toBeInTheDocument();
        expect(screen.getByText('PREMIUM')).toBeInTheDocument();
    });

    it('hides premium inventory reports for non-premium tenants', () => {
        render(<Sidebar canAccessAccounting canAccessInventoryReports={false} />);

        expect(screen.queryByText('Reorder Report')).not.toBeInTheDocument();
        expect(screen.queryByText('Shrinkage Report')).not.toBeInTheDocument();
    });
});