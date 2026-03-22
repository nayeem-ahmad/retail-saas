const DEFAULT_PLATFORM_ADMIN_EMAILS = ['nayeem.ahmad@gmail.com'];

export function getPlatformAdminEmails() {
    const configured = process.env.PLATFORM_ADMIN_EMAILS
        ?.split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

    return configured && configured.length > 0 ? configured : DEFAULT_PLATFORM_ADMIN_EMAILS;
}

export function isPlatformAdminEmail(email?: string | null) {
    if (!email) {
        return false;
    }

    return getPlatformAdminEmails().includes(email.trim().toLowerCase());
}