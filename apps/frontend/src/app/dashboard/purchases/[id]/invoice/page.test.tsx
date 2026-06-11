import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PurchaseInvoicePage from './page';

jest.mock('next/navigation', () => ({
    useParams: jest.fn(() => ({ id: 'pur-1' })),
    useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
    useSearchParams: jest.fn(() => ({ get: jest.fn().mockReturnValue(null) })),
    usePathname: jest.fn(() => '/dashboard/purchases/pur-1/invoice'),
}));

jest.mock('@/lib/api', () => ({
    api: {
        getPurchaseInvoice: jest.fn(),
    },
}));

const mockInvoice = {
    purchase: {
        id: 'pur-1',
        purchase_number: 'PUR-00001',
        created_at: '2026-01-15T10:00:00Z',
        notes: 'Urgent order',
        subtotal_amount: '10000',
        tax_amount: '500',
        discount_amount: '200',
        freight_amount: '300',
        total_amount: '10600',
        store: { name: 'Main Store' },
        supplier: {
            name: 'ABC Supplier',
            phone: '0171111111',
            email: 'supplier@abc.com',
            address: '123 Supplier St',
        },
        items: [
            {
                id: 'item-1',
                quantity: 10,
                unit_cost: '1000',
                total_cost: '10000',
                product: { name: 'Widget A', sku: 'WID-001' },
            },
        ],
        payments: [
            {
                id: 'pay-1',
                amount: '10600',
                method: 'cash',
                paid_at: '2026-01-15T11:00:00Z',
                reference: 'REF-001',
            },
        ],
    },
};

function getApi() {
    return require('@/lib/api').api;
}

describe('PurchaseInvoicePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.print = jest.fn();

        const nav = require('next/navigation');
        nav.useParams.mockReturnValue({ id: 'pur-1' });

        getApi().getPurchaseInvoice.mockResolvedValue(mockInvoice);
    });

    it('shows loading state initially', () => {
        getApi().getPurchaseInvoice.mockReturnValue(new Promise(() => {}));
        render(<PurchaseInvoicePage />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders invoice details after loading', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getAllByText('PUR-00001').length).toBeGreaterThan(0);
        });
        expect(screen.getByText('ABC Supplier')).toBeInTheDocument();
        expect(screen.getByText('Widget A')).toBeInTheDocument();
    });

    it('shows "Invoice not found" when API returns null', async () => {
        getApi().getPurchaseInvoice.mockResolvedValue(null);
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getByText(/not found/i)).toBeInTheDocument();
        });
    });

    it('shows purchase number in the invoice', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getAllByText(/PUR-00001/).length).toBeGreaterThan(0);
        });
    });

    it('shows supplier info', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getByText('0171111111')).toBeInTheDocument();
        });
    });

    it('shows item name in invoice', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getAllByText('Widget A').length).toBeGreaterThan(0);
        });
    });

    it('shows store name', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getAllByText('Main Store').length).toBeGreaterThan(0);
        });
    });

    it('shows notes when present', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getByText(/Urgent order/)).toBeInTheDocument();
        });
    });

    it('shows print button', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
        });
    });

    it('calls window.print when print button clicked', async () => {
        render(<PurchaseInvoicePage />);
        await waitFor(() => screen.getByRole('button', { name: /print/i }));
        fireEvent.click(screen.getByRole('button', { name: /print/i }));
        expect(window.print).toHaveBeenCalled();
    });

    it('shows error state when fetch fails', async () => {
        getApi().getPurchaseInvoice.mockRejectedValue(new Error('Server error'));
        render(<PurchaseInvoicePage />);
        await waitFor(() => {
            expect(screen.getByText(/failed to load invoice/i)).toBeInTheDocument();
        });
    });
});
