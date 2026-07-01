import { routes } from '@/lib/routes';

export type BreadcrumbItem = { label: string; href?: string };

export type ModuleKey =
    | 'dashboard'
    | 'sales'
    | 'purchases'
    | 'accounting'
    | 'inventory'
    | 'crm'
    | 'hr'
    | 'settings'
    | 'admin'
    | 'billing'
    | 'storefront'
    | 'team'
    | 'help'
    | 'manufacturing'
    | 'profile'
    | 'status'
    | 'support'
    | 'smsCredits'
    | 'aiCredits';

const moduleRoots: Record<ModuleKey, string> = {
    dashboard: routes.home,
    sales: routes.sales.root,
    purchases: routes.purchases.root,
    accounting: routes.accounting.root,
    inventory: routes.inventory.root,
    crm: routes.crm.root,
    hr: routes.hr.root,
    settings: routes.settings.root,
    admin: routes.admin.root,
    billing: routes.billing,
    storefront: routes.storefront.root,
    team: routes.team,
    help: routes.help,
    manufacturing: routes.manufacturing,
    profile: routes.profile,
    status: routes.status,
    support: routes.support,
    smsCredits: routes.smsCredits,
    aiCredits: routes.aiCredits,
};

/** Prepend Home and optional module hub segments before the current page label. */
export function buildBreadcrumbs(
    homeLabel: string,
    trail: BreadcrumbItem[],
    homeHref: string = routes.home,
): BreadcrumbItem[] {
    return [{ label: homeLabel, href: homeHref }, ...trail];
}

/** Home → Module hub → current page (most list/hub screens). */
export function modulePageBreadcrumbs(
    homeLabel: string,
    moduleLabel: string,
    pageLabel: string,
    module: ModuleKey,
): BreadcrumbItem[] {
    const moduleHref = moduleRoots[module];
    const isHub = pageLabel === moduleLabel;

    return buildBreadcrumbs(homeLabel, isHub
        ? [{ label: moduleLabel }]
        : [
            { label: moduleLabel, href: moduleHref },
            { label: pageLabel },
        ]);
}

/** Home → Module → parent page → current page (detail/nested screens). */
export function nestedPageBreadcrumbs(
    homeLabel: string,
    moduleLabel: string,
    module: ModuleKey,
    parents: BreadcrumbItem[],
    pageLabel: string,
): BreadcrumbItem[] {
    return buildBreadcrumbs(homeLabel, [
        { label: moduleLabel, href: moduleRoots[module] },
        ...parents,
        { label: pageLabel },
    ]);
}