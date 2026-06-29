'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';

export default function LeadDetailRedirectPage() {
    const { id } = useParams();
    const router = useRouter();

    useEffect(() => {
        if (id) {
            router.replace(`${routes.crm.leads}?lead=${id}`);
        } else {
            router.replace(routes.crm.leads);
        }
    }, [id, router]);

    return null;
}