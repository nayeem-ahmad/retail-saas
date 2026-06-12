'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Mail, UserPlus, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { syncLocalePreferenceFromSession } from '@/lib/localization/preference';
import { useI18n, formatMessage } from '@/lib/i18n';

type PageStatus = 'loading' | 'ready' | 'accepting' | 'success' | 'error';

interface InvitationInfo {
    tenantName: string;
    email: string;
    role: string;
    expiresAt: string;
}

function AcceptInvitationContent() {
    const { t } = useI18n();
    const m = t.auth.acceptInvitation;
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<PageStatus>('loading');
    const [info, setInfo] = useState<InvitationInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState(m.defaultError);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentEmail, setCurrentEmail] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage(m.missingToken);
            return;
        }

        const accessToken = localStorage.getItem('access_token');
        setIsLoggedIn(Boolean(accessToken));

        if (accessToken) {
            api.getMe()
                .then((me) => setCurrentEmail(me.email))
                .catch(() => setIsLoggedIn(false));
        }

        api.getInvitationInfo(token)
            .then((data) => {
                setInfo(data);
                setStatus('ready');
            })
            .catch((error: Error) => {
                setErrorMessage(error.message);
                setStatus('error');
            });
    }, [token]);

    const redirectTarget = token
        ? `/accept-invitation?token=${encodeURIComponent(token)}`
        : '/dashboard';

    const handleAccept = async () => {
        if (!token) return;
        setStatus('accepting');
        try {
            await api.acceptInvitation(token);
            const me = await api.getMe();
            syncLocalePreferenceFromSession(me, { overwrite: true });

            const matchedTenant = me.tenants?.find((tenant: any) => tenant.name === info?.tenantName)
                || me.tenants?.at(-1);

            if (matchedTenant) {
                localStorage.setItem('tenant_id', matchedTenant.id);
                if (matchedTenant.stores?.[0]?.id) {
                    localStorage.setItem('store_id', matchedTenant.stores[0].id);
                }
            }

            setStatus('success');
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (error: any) {
            setErrorMessage(error?.message || m.acceptFailed);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-4 font-sans text-[#111827]">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
                    <div className="text-center mb-8">
                        <span className="text-xl font-black tracking-tight text-blue-600">{m.brand}</span>
                    </div>

                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-5 py-6">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="font-semibold text-gray-800">{m.loading}</p>
                        </div>
                    )}

                    {status === 'ready' && info && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 text-blue-600" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{m.title}</h1>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    {formatMessage(m.joinDescription, { tenant: info.tenantName, role: info.role })}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm space-y-2">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{info.email}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {formatMessage(m.expires, { date: new Date(info.expiresAt).toLocaleDateString() })}
                                </p>
                            </div>

                            {!isLoggedIn ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600 text-center">
                                        {formatMessage(m.signInPrompt, { email: info.email })}
                                    </p>
                                    <Link
                                        href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                                    >
                                        {m.signInToAccept}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href={`/signup?redirect=${encodeURIComponent(redirectTarget)}`}
                                        className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-blue-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
                                    >
                                        {m.createAccount}
                                    </Link>
                                </div>
                            ) : currentEmail && currentEmail !== info.email ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {formatMessage(m.emailMismatch, { currentEmail: currentEmail!, invitedEmail: info.email })}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleAccept}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                                >
                                    {m.accept}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {status === 'accepting' && (
                        <div className="flex flex-col items-center gap-5 py-6">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="font-semibold text-gray-800">{m.accepting}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-5 py-6 text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-9 h-9 text-green-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{m.successTitle}</h1>
                                <p className="text-gray-500 mt-2 text-sm">{m.successDescription}</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-5 py-6 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                <XCircle className="w-9 h-9 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{m.errorTitle}</h1>
                                <p className="text-gray-500 mt-2 text-sm">{errorMessage}</p>
                            </div>
                            <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                {m.goToSignIn}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <AcceptInvitationContent />
        </Suspense>
    );
}