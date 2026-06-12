'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useMemo } from 'react';
import { DEFAULT_LOCALE } from '@/lib/localization/config';
import { messageCatalog } from '@/lib/localization/messages';
import { getStoredLocalePreference } from '@/lib/localization/preference';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const m = useMemo(() => {
        const locale = getStoredLocalePreference() ?? DEFAULT_LOCALE;
        return messageCatalog[locale].marketing.globalError;
    }, []);

    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
                    <h2>{m.title}</h2>
                    <p style={{ color: '#666' }}>{m.description}</p>
                    <button onClick={reset} style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}>
                        {m.tryAgain}
                    </button>
                </div>
            </body>
        </html>
    );
}