'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f4f6] font-sans text-gray-900 px-4">
                    <div className="text-center space-y-6 max-w-lg">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 border border-red-100">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Critical error</p>
                            <h1 className="text-4xl font-black tracking-tight text-gray-950">Application error</h1>
                            <p className="text-gray-500 text-base leading-relaxed">
                                A critical error occurred. Please refresh the page to try again.
                            </p>
                            {error.digest && (
                                <p className="text-xs font-mono text-gray-400 mt-2">Error ID: {error.digest}</p>
                            )}
                        </div>

                        <button
                            onClick={reset}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Application
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
