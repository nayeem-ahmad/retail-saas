import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] font-sans text-[#111827] px-4">
            <div className="text-center space-y-6 max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border border-blue-100 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>v0.1 Preview</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-gray-900">
                    Retail SaaS <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Platform</span>
                </h1>

                <p className="text-gray-500 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed uppercase tracking-tight">
                    Enterprise-grade retail management. Simplified for the next generation of commerce.
                </p>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/login"
                        className="group bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-blue-200 transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-3 w-full sm:w-auto justify-center"
                    >
                        <span>Entry Point (Mock)</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <a
                        href="#"
                        className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-10 rounded-2xl border border-gray-200 transition-all duration-300 w-full sm:w-auto text-center"
                    >
                        View Repository
                    </a>
                </div>

                <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="font-black text-2xl tracking-tighter italic">LOGISTIC</div>
                    <div className="font-black text-2xl tracking-tighter italic">RETAILX</div>
                    <div className="font-black text-2xl tracking-tighter italic">STOREMART</div>
                    <div className="font-black text-2xl tracking-tighter italic">GLOBECOM</div>
                </div>
            </div>

            <div className="absolute bottom-8 text-xs font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                System Status: Ready for Development
            </div>
        </div>
    );
}
