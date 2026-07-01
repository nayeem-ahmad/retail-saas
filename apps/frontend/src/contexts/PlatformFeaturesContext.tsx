'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_PLATFORM_FEATURES, type PlatformFeatures } from '@erp71/shared-types';

const PlatformFeaturesContext = createContext<PlatformFeatures>(DEFAULT_PLATFORM_FEATURES);

export function PlatformFeaturesProvider({
    features,
    children,
}: {
    features?: PlatformFeatures | null;
    children: ReactNode;
}) {
    return (
        <PlatformFeaturesContext.Provider value={features ?? DEFAULT_PLATFORM_FEATURES}>
            {children}
        </PlatformFeaturesContext.Provider>
    );
}

export function usePlatformFeatures(): PlatformFeatures {
    return useContext(PlatformFeaturesContext);
}