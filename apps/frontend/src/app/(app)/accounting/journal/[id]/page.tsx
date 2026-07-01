import { redirect } from 'next/navigation';

export default async function LegacyJournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/accounting/vouchers/${id}`);
}