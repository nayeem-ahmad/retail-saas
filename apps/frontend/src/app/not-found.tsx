import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f4f6] font-sans text-gray-900 px-4">
            <div className="text-center space-y-6 max-w-lg">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-100 border border-gray-200">
                    <SearchX className="w-10 h-10 text-gray-400" />
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Error 404</p>
                    <h1 className="text-4xl font-black tracking-tight text-gray-950">Page not found</h1>
                    <p className="text-gray-500 text-base leading-relaxed">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
