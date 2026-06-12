import { coreMessages } from './core';
import { salesMessages } from './sales';
import { purchasesMessages } from './purchases';
import { accountingMessages } from './accounting';
import { customersMessages } from './customers';
import { inventoryExtrasMessages } from './inventoryExtras';
import { crmHrMessages } from './crmHr';
import { adminMessages } from './admin';
import { storefrontMessages } from './storefront';
import { marketingMessages } from './marketing';
import { settingsExtrasMessages } from './settingsExtras';
import { reportsMessages } from './reports';
import { componentsMessages } from './components';
import { helpMessages } from './help';

export const bnMessages = {
    ...coreMessages,
    ...salesMessages,
    ...purchasesMessages,
    ...accountingMessages,
    ...customersMessages,
    ...inventoryExtrasMessages,
    ...crmHrMessages,
    admin: adminMessages,
    storefront: storefrontMessages,
    marketing: marketingMessages,
    settingsExtras: settingsExtrasMessages,
    reports: reportsMessages,
    components: componentsMessages,
    help: helpMessages,
} as const;