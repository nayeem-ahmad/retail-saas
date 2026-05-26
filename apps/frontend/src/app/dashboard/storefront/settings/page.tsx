'use client';

import { useEffect, useState } from 'react';
import { Settings, Globe, ToggleLeft, ToggleRight, Save, ExternalLink } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

const isBrowser = Boolean(globalThis.window);

const API_BASE = isBrowser
    ? (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000')
    : '';

interface StorefrontSettings {
    id: string;
    name: string;
    storefront_slug: string | null;
    storefront_enabled: boolean;
    storefront_banner: string | null;
    storefront_hero_image: string | null;
    storefront_hero_headline: string | null;
}

export default function StorefrontSettingsPage() {
    const [loading, setLoading] = useState(true);

    const [slug, setSlug] = useState('');
    const [enabled, setEnabled] = useState(false);
    const [banner, setBanner] = useState('');
    const [heroImage, setHeroImage] = useState('');
    const [heroHeadline, setHeroHeadline] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        fetchWithAuth('/tenants/storefront-settings')
            .then((data: StorefrontSettings) => {
                setSlug(data.storefront_slug || '');
                setEnabled(data.storefront_enabled ?? false);
                setBanner(data.storefront_banner || '');
                setHeroImage(data.storefront_hero_image || '');
                setHeroHeadline(data.storefront_hero_headline || '');
            })
            .catch((err) => console.error('Failed to load settings', err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const updated: StorefrontSettings = await fetchWithAuth('/tenants/storefront-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storefront_slug: slug.trim() || null,
                    storefront_enabled: enabled,
                    storefront_banner: banner.trim() || null,
                    storefront_hero_image: heroImage.trim() || null,
                    storefront_hero_headline: heroHeadline.trim() || null,
                }),
            });
            setSlug(updated.storefront_slug || '');
            setEnabled(updated.storefront_enabled ?? false);
            setBanner(updated.storefront_banner || '');
            setHeroImage(updated.storefront_hero_image || '');
            setHeroHeadline(updated.storefront_hero_headline || '');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setSaveError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const publicStoreUrl =
        isBrowser && slug ? `${globalThis.window.location.origin}/store/${slug}` : null;

    return (
        <div className="h-full overflow-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Storefront Settings</h1>
                        <p className="text-sm text-gray-500">Configure your public online store</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                        {/* Enable / Disable toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Enable Storefront</p>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Make your store publicly accessible at your slug URL
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEnabled((v) => !v)}
                                className="flex items-center space-x-2 focus:outline-none"
                                aria-label="Toggle storefront"
                            >
                                {enabled ? (
                                    <ToggleRight className="w-10 h-10 text-blue-600" />
                                ) : (
                                    <ToggleLeft className="w-10 h-10 text-gray-300" />
                                )}
                            </button>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Store Slug */}
                        <div>
                            <label htmlFor="store-slug" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Store Slug
                            </label>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400 whitespace-nowrap">/store/</span>
                                <input
                                    id="store-slug"
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50))}
                                    placeholder="my-store"
                                    maxLength={50}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Lowercase letters, numbers, hyphens only. Max 50 characters.
                            </p>
                        </div>

                        {/* Public URL display */}
                        {publicStoreUrl && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center space-x-2 min-w-0">
                                    <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm font-medium text-blue-700 truncate">
                                        {publicStoreUrl}
                                    </span>
                                </div>
                                <a
                                    href={publicStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 ml-3 text-blue-600 hover:text-blue-800"
                                    title="Open store"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        )}

                        {/* Banner Text */}
                        <div>
                            <label htmlFor="store-banner" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Banner Text
                            </label>
                            <textarea
                                id="store-banner"
                                value={banner}
                                onChange={(e) => setBanner(e.target.value)}
                                placeholder="Free delivery on orders over ৳500!"
                                rows={2}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Shown as a banner at the top of your storefront.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Optional.</p>
                        </div>

                        <div>
                            <label htmlFor="store-hero-headline" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Hero Headline
                            </label>
                            <input
                                id="store-hero-headline"
                                type="text"
                                value={heroHeadline}
                                onChange={(e) => setHeroHeadline(e.target.value)}
                                placeholder="New Season Arrivals"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Used as the main headline in the storefront hero.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Optional.</p>
                        </div>

                        <div>
                            <label htmlFor="store-hero-image" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Hero Image URL
                            </label>
                            <input
                                id="store-hero-image"
                                type="url"
                                value={heroImage}
                                onChange={(e) => setHeroImage(e.target.value)}
                                placeholder="https://..."
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                If empty, the storefront uses a default Unsplash hero image.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Optional.</p>
                        </div>

                        {saveError && (
                            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                                {saveError}
                            </p>
                        )}

                        {saveSuccess && (
                            <p className="text-emerald-700 text-sm bg-emerald-50 rounded-lg px-3 py-2">
                                Settings saved successfully!
                            </p>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                            >
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
