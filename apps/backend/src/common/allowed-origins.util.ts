const MIGRATION_FRONTEND_ORIGINS = [
    'https://app.erp71.com',
    'https://app.nayeemahmad.com',
];

function toOrigin(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) return null;
    try {
        return new URL(trimmed).origin;
    } catch {
        return trimmed.replace(/\/$/, '');
    }
}

/** Origins permitted for CORS and CSRF checks. */
export function getAllowedOrigins(): string[] {
    const origins = new Set<string>();

    const add = (value?: string) => {
        const origin = value ? toOrigin(value) : null;
        if (origin) origins.add(origin);
    };

    add(process.env.FRONTEND_URL);
    add(process.env.BACKEND_PUBLIC_URL);
    (process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .forEach(add);

    if (process.env.NODE_ENV === 'production') {
        MIGRATION_FRONTEND_ORIGINS.forEach((origin) => origins.add(origin));
    }

    if (origins.size === 0) {
        origins.add('http://localhost:3000');
    }

    return [...origins];
}

export function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return true;
    return getAllowedOrigins().includes(origin);
}