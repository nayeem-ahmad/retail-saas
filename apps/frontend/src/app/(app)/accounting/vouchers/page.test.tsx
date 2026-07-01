import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountingVouchersListPage from './page';
import { api } from '@/lib/api';

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: jest.fn() }),
    useSearchParams: () => ({ get: () => null }),
}));

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

jest.mock('@/components/data-table', () => ({
    DataTable: ({ data }: { data: Array<{ voucher_number: string }> }) => (
        <div>
            {data.map((row) => (
                <div key={row.voucher_number}>{row.voucher_number}</div>
            ))}
        </div>
    ),
}));

jest.mock('@/lib/branding', () => ({
    useBranding: () => ({ businessName: 'Demo Store' }),
}));

jest.mock('@/lib/toast', () => ({
    toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('lucide-react', () => ({
    ChevronLeft: () => <span />,
    ChevronRight: () => <span />,
    Eye: () => <span />,
    FileText: () => <span />,
    Pencil: () => <span />,
    Plus: () => <span />,
    Printer: () => <span />,
    Trash2: () => <span />,
}));

jest.mock('@/lib/api', () => ({
    api: {
        getVouchers: jest.fn(),
        getVoucher: jest.fn(),
        deleteVoucher: jest.fn(),
    },
}));

describe('AccountingVouchersListPage', () => {
    it('loads voucher rows with filters and pagination controls', async () => {
        const getVouchers = api.getVouchers as jest.Mock;
        getVouchers.mockResolvedValue({
            data: [
                {
                    id: 'voucher-1',
                    voucher_number: 'CP-00001',
                    voucher_type: 'cash_payment',
                    reference_number: 'CP-REF-01',
                    date: '2026-03-21T00:00:00.000Z',
                    total_amount: 125,
                },
            ],
            meta: { page: 1, limit: 20, total: 2, totalPages: 2 },
        });

        render(<AccountingVouchersListPage />);

        await waitFor(() => {
            expect(screen.getByText('CP-00001')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Journal voucher type'), {
            target: { value: 'cash_payment' },
        });

        await waitFor(() => {
            expect(getVouchers).toHaveBeenLastCalledWith(expect.objectContaining({ voucherType: 'cash_payment' }));
        });

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        await waitFor(() => {
            expect(getVouchers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
        });
    });
});