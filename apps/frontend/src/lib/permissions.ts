export function hasPermission(permissions: string[] | undefined, perm: string): boolean {
    return Boolean(permissions?.includes(perm));
}

export function isOwner(role: string | null | undefined): boolean {
    return role === 'OWNER';
}