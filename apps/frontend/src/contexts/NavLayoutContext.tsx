'use client';

import { createContext, useContext } from 'react';
import {
    DEFAULT_PLATFORM_ADMIN_NAV_LAYOUT,
    DEFAULT_TENANT_NAV_LAYOUT,
    type NavLayoutNode,
} from '@erp71/shared-types';

type NavLayoutContextValue = {
    tenantLayout: NavLayoutNode[];
    platformAdminLayout: NavLayoutNode[];
};

const NavLayoutContext = createContext<NavLayoutContextValue>({
    tenantLayout: DEFAULT_TENANT_NAV_LAYOUT,
    platformAdminLayout: DEFAULT_PLATFORM_ADMIN_NAV_LAYOUT,
});

export function NavLayoutProvider({
    tenantLayout,
    platformAdminLayout,
    children,
}: {
    tenantLayout: NavLayoutNode[];
    platformAdminLayout: NavLayoutNode[];
    children: React.ReactNode;
}) {
    return (
        <NavLayoutContext.Provider value={{ tenantLayout, platformAdminLayout }}>
            {children}
        </NavLayoutContext.Provider>
    );
}

export function useNavLayouts() {
    return useContext(NavLayoutContext);
}