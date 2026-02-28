'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate local login
        setTimeout(() => {
            router.push('/dashboard');
        }, 1200);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-4 font-sans text-[#111827]">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                            <Lock className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-gray-500 mt-2 text-sm">Please enter your details to sign in</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                            </label>
                            <a href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account? <a href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">Sign up for free</a>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest font-semibold">
                    Retail SaaS Platform v0.1
                </p>
            </div>
        </div>
    );
}
