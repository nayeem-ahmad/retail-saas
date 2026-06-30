'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Mic, MicOff, X } from 'lucide-react';
import { useI18n, formatMessage } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import {
    extractBestTranscript,
    getSpeechRecognitionCtor,
    getVoiceNavHintIds,
    matchVoiceNav,
    speechLocaleToBcp47,
    type BrowserSpeechRecognition,
} from '@/lib/voice-nav';

const LISTEN_TIMEOUT_MS = 6_000;

export default function VoiceNavWidget() {
    const { t, locale } = useI18n();
    const m = t.components.voiceNavWidget;
    const router = useRouter();
    const [supported, setSupported] = useState(false);
    const [listening, setListening] = useState(false);
    const [hintOpen, setHintOpen] = useState(false);
    const [heard, setHeard] = useState<string | null>(null);
    const heardRef = useRef<string | null>(null);
    const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handledRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSupported(getSpeechRecognitionCtor() !== null);
    }, []);

    useEffect(() => {
        if (!hintOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setHintOpen(false);
        };
        const onPointer = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setHintOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        const id = setTimeout(() => document.addEventListener('mousedown', onPointer), 0);
        return () => {
            window.removeEventListener('keydown', onKey);
            clearTimeout(id);
            document.removeEventListener('mousedown', onPointer);
        };
    }, [hintOpen]);

    const clearListenTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const stopListening = useCallback(() => {
        clearListenTimeout();
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setListening(false);
    }, [clearListenTimeout]);

    useEffect(() => () => {
        clearListenTimeout();
        recognitionRef.current?.abort();
    }, [clearListenTimeout]);

    const navigateToMatch = useCallback((transcript: string) => {
        const match = matchVoiceNav(transcript);
        if (!match) {
            const hints = getVoiceNavHintIds()
                .map((id) => m.targets[id])
                .join(', ');
            toast.error(formatMessage(m.notRecognized, { hints }));
            return;
        }

        const pageLabel = m.targets[match.route.id];
        toast.success(formatMessage(m.navigating, { page: pageLabel }));
        router.push(match.route.path);
        setHintOpen(false);
    }, [m, router]);

    const handleTranscript = useCallback((transcript: string) => {
        const trimmed = transcript.trim();
        if (!trimmed || handledRef.current) return;
        handledRef.current = true;
        heardRef.current = trimmed;
        setHeard(trimmed);
        stopListening();
        navigateToMatch(trimmed);
    }, [navigateToMatch, stopListening]);

    const startListening = useCallback(() => {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) {
            toast.error(m.unsupported);
            return;
        }

        handledRef.current = false;
        heardRef.current = null;
        setHeard(null);
        clearListenTimeout();
        setHintOpen(false);

        const recognition = new Ctor();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = speechLocaleToBcp47(locale);
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = extractBestTranscript(event);
            if (transcript) {
                heardRef.current = transcript;
                setHeard(transcript);
            }
            const finalResult = Array.from({ length: event.results.length }, (_, i) => event.results[i])
                .find((result) => result.isFinal);
            if (finalResult?.[0]?.transcript) {
                handleTranscript(finalResult[0].transcript);
            }
        };

        recognition.onerror = (event) => {
            stopListening();
            if (event.error === 'not-allowed') {
                toast.error(m.micDenied);
                return;
            }
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                toast.error(m.listenError);
            }
        };

        recognition.onend = () => {
            clearListenTimeout();
            setListening(false);
            recognitionRef.current = null;
            if (!handledRef.current && heardRef.current) {
                handleTranscript(heardRef.current);
            }
        };

        try {
            recognition.start();
            setListening(true);
            timeoutRef.current = setTimeout(() => {
                if (!handledRef.current) {
                    recognition.stop();
                }
            }, LISTEN_TIMEOUT_MS);
        } catch {
            stopListening();
            toast.error(m.listenError);
        }
    }, [clearListenTimeout, handleTranscript, locale, m, stopListening]);

    const handleMicClick = () => {
        if (listening) {
            stopListening();
            if (heard) {
                handleTranscript(heard);
            }
            return;
        }
        void startListening();
    };

    const hintTargets = getVoiceNavHintIds();

    return (
        <div ref={rootRef} className="relative flex items-center gap-0.5">
            <style>{`
                @keyframes voiceHeaderGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
                    50% { box-shadow: 0 0 0 4px rgba(147, 51, 234, 0); }
                }
                @keyframes voiceHeaderPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
            `}</style>

            {hintOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-800">{m.hintTitle}</p>
                        <button
                            type="button"
                            onClick={() => setHintOpen(false)}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label={m.closeAria}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="mb-2 text-xs text-gray-500">{m.hintDescription}</p>
                    <ul className="flex flex-col gap-1.5">
                        {hintTargets.map((id) => (
                            <li
                                key={id}
                                className="rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-800"
                            >
                                “{m.examples[id]}”
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button
                type="button"
                onClick={() => setHintOpen((open) => !open)}
                className={`rounded-lg p-2 transition-colors ${
                    hintOpen
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
                aria-label={m.hintAria}
                title={m.hintTitle}
            >
                <HelpCircle className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={handleMicClick}
                disabled={!supported}
                className={`relative rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    listening
                        ? 'bg-red-50 text-red-600'
                        : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
                style={{
                    animation: supported && listening
                        ? 'voiceHeaderPulse 1.2s ease-in-out infinite'
                        : supported && !listening
                            ? 'voiceHeaderGlow 2.4s ease-in-out infinite'
                            : undefined,
                }}
                aria-label={listening ? m.stopAria : m.startAria}
                title={!supported ? m.unsupported : listening ? m.listeningTitle : m.startTitle}
            >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
            </button>
        </div>
    );
}