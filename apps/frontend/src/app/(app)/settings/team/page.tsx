import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';

/** Legacy path — canonical team management lives at /team. */
export default function SettingsTeamRedirectPage() {
    redirect(routes.team);
}