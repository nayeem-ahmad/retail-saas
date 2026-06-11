'use client';

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import QuoteDetailsPage from './page';

const pushMock = jest.fn();
let searchValue = '';

jest.mock('next/navigation', () => ({
    useParams: () => ({ id: 'quote-1' }),
    useRouter: () => ({ push: pushMock }),
    useSearchParams: () => ({ get: (key: string) => (key === 'edit' ? searchValue : null) }),
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('../../../../lib/api', () => ({
    api: {
        getQuotation: jest.fn(),
        updateQuotation: jest.fn(),
        deleteQuotation: jest.fn(),
        reviseQuotation: jest.fn(),
        convertQuotation: jest.fn(),
        updateQuotationStatus: jest.fn(),
        getCustomers: jest.fn(),
        getProducts: jest.fn(),
    },
}));

jest.mock('../../../../lib/format', () => ({
    formatBDT: (v: number) => `BDT ${v}`,
    formatDate: (v: string) => `DATE:${v}`,
}));

const mockQuote = {
    id: 'quote-1',
    quote_number: 'QUO-00001',
    version: 1,
    status: 'DRAFT',
    valid_until: '2026-12-31T00:00:00.000Z',
    total_amount: 1500,
    customer_id: 'cust-1',
    notes: 'Test note here',
    customer: {
        name: 'Test Customer',
        phone: '01711111111',
    },
    items: [
        {
            id: 'item-1',
            product_id: 'prod-1',
            quantity: 3,
            unit_price: '500',
            product: { name: 'Product Alpha', sku: 'SKU-001' },
        },
    ],
};

describe('QuoteDetailsPage', () => {
    beforeEach(() => {
        pushMock.mockReset();
        searchValue = '';
        window.alert = jest.fn();
        window.confirm = jest.fn(() => true);
        window.print = jest.fn();

        const { api } = require('../../../../lib/api');
        api.getQuotation.mockResolvedValue(mockQuote);
        api.updateQuotation.mockResolvedValue({ ...mockQuote });
        api.deleteQuotation.mockResolvedValue({ deleted: true });
        api.reviseQuotation.mockResolvedValue({ id: 'quote-2' });
        api.convertQuotation.mockResolvedValue({ id: 'order-1', order_number: 'ORD-00001' });
        api.updateQuotationStatus.mockResolvedValue({ ...mockQuote, status: 'SENT' });
        api.getCustomers.mockResolvedValue([{ id: 'cust-1', name: 'Test Customer' }]);
        api.getProducts.mockResolvedValue([
            { id: 'prod-2', name: 'Product Beta', sku: 'SKU-002', price: '750' },
        ]);
    });

    it('shows loading state initially', () => {
        const { api } = require('../../../../lib/api');
        api.getQuotation.mockReturnValue(new Promise(() => {})); // never resolves
        render(<QuoteDetailsPage />);
        expect(screen.getByText(/loading quote/i)).toBeInTheDocument();
    });

    it('renders quote details after loading', async () => {
        render(<QuoteDetailsPage />);
        await waitFor(() => {
            expect(screen.getByText('QUO-00001')).toBeInTheDocument();
        });
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
        expect(screen.getByText('Product Alpha')).toBeInTheDocument();
        expect(screen.getByText('STATUS: DRAFT')).toBeInTheDocument();
    });

    it('shows "Quote not found" when API returns null', async () => {
        const { api } = require('../../../../lib/api');
        api.getQuotation.mockResolvedValue(null);
        render(<QuoteDetailsPage />);
        await waitFor(() => {
            expect(screen.getByText(/quote not found/i)).toBeInTheDocument();
        });
    });

    it('shows customer notes when present', async () => {
        render(<QuoteDetailsPage />);
        await waitFor(() => {
            expect(screen.getByText(/Test note here/)).toBeInTheDocument();
        });
    });

    it('shows "Mark as Sent" button for DRAFT status', async () => {
        render(<QuoteDetailsPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /mark as sent/i })).toBeInTheDocument();
        });
    });

    it('shows "Mark Accepted" and "Mark Rejected" for SENT status', async () => {
        const { api } = require('../../../../lib/api');
        api.getQuotation.mockResolvedValue({ ...mockQuote, status: 'SENT' });
        render(<QuoteDetailsPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /mark accepted/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /mark rejected/i })).toBeInTheDocument();
        });
    });

    it('does not show Revise or Convert when status is REVISED', async () => {
        const { api } = require('../../../../lib/api');
        api.getQuotation.mockResolvedValue({ ...mockQuote, status: 'REVISED' });
        render(<QuoteDetailsPage />);
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /revise/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /convert to order/i })).not.toBeInTheDocument();
        });
    });

    it('calls updateQuotationStatus when "Mark as Sent" is clicked', async () => {
        const { api } = require('../../../../lib/api');
        render(<QuoteDetailsPage />);
        await waitFor(() => screen.getByRole('button', { name: /mark as sent/i }));
        fireEvent.click(screen.getByRole('button', { name: /mark as sent/i }));
        await waitFor(() => {
            expect(api.updateQuotationStatus).toHaveBeenCalledWith('quote-1', 'SENT');
        });
    });

    it('calls deleteQuotation after confirmation', async () => {
        const { api } = require('../../../../lib/api');
        render(<QuoteDetailsPage />);
        await waitFor(() => screen.getByRole('button', { name: /delete/i }));
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        await waitFor(() => {
            expect(api.deleteQuotation).toHaveBeenCalledWith('quote-1');
        });
        expect(pushMock).toHaveBeenCalledWith('/dashboard/quotes');
    });

    it('does not delete when confirm is cancelled', async () => {
        const { api } = require('../../../../lib/api');
        window.confirm = jest.fn(() => false);
        render(<QuoteDetailsPage />);
        await waitFor(() => screen.getByRole('button', { name: /delete/i }));
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        await waitFor(() => expect(api.deleteQuotation).not.toHaveBeenCalled());
    });

    it('calls reviseQuotation and navigates to new quote', async () => {
        const { api } = require('../../../../lib/api');
        render(<QuoteDetailsPage />);
        await waitFor(() => screen.getByRole('button', { name: /revise/i }));
        fireEvent.click(screen.getByRole('button', { name: /revise/i }));
        await waitFor(() => {
            expect(api.reviseQuotation).toHaveBeenCalledWith('quote-1');
        });
        expect(pushMock).toHaveBeenCalledWith('/dashboard/quotes/quote-2');
    });

    it('calls convertQuotation and navigates to new order', async () => {
        const { api } = require('../../../../lib/api');
        render(<QuoteDetailsPage />);
        await waitFor(() => screen.getByRole('button', { name: /convert to order/i }));
        fireEvent.click(screen.getByRole('button', { name: /convert to order/i }));
        await waitFor(() => {
            expect(api.convertQuotation).toHaveBeenCalledWith('quote-1');
        });
        expect(pushMock).toHaveBeenCalledWith('/dashboard/orders/order-1');
    });

    it('navigates to edit mode when Edit button is clicked', async () => {
        render(<QuoteDetailsPage />);
        await waitFor(() => screen.getByRole('button', { name: /^edit$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
        expect(pushMock).toHaveBeenCalledWith('/dashboard/quotes/quote-1?edit=true');
    });

    it('prints when Print PDF is clicked', async () => {
        render(<QuoteDetailsPage />);
        await waitFor(() => screen.getByRole('button', { name: /print pdf/i }));
        fireEvent.click(screen.getByRole('button', { name: /print pdf/i }));
        expect(window.print).toHaveBeenCalled();
    });

    describe('Edit mode', () => {
        beforeEach(() => {
            searchValue = 'true';
        });

        it('shows edit mode banner and loads customers/products', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => {
                expect(screen.getByText(/edit mode/i)).toBeInTheDocument();
            });
            const { api } = require('../../../../lib/api');
            expect(api.getCustomers).toHaveBeenCalled();
            expect(api.getProducts).toHaveBeenCalled();
        });

        it('shows Save Changes button in edit mode', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
            });
        });

        it('shows product search input in edit mode', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/search products by name or sku/i)).toBeInTheDocument();
            });
        });

        it('shows product search dropdown when typing', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => screen.getByPlaceholderText(/search products by name or sku/i));
            fireEvent.change(screen.getByPlaceholderText(/search products by name or sku/i), {
                target: { value: 'Beta' },
            });
            await waitFor(() => {
                expect(screen.getByText('Product Beta')).toBeInTheDocument();
            });
        });

        it('calls updateQuotation on save', async () => {
            const { api } = require('../../../../lib/api');
            render(<QuoteDetailsPage />);
            await waitFor(() => screen.getByRole('button', { name: /save changes/i }));
            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
            await waitFor(() => {
                expect(api.updateQuotation).toHaveBeenCalledWith(
                    'quote-1',
                    expect.objectContaining({
                        items: expect.arrayContaining([
                            expect.objectContaining({ productId: 'prod-1', quantity: 3 }),
                        ]),
                    }),
                );
            });
            expect(pushMock).toHaveBeenCalledWith('/dashboard/quotes/quote-1');
        });

        it('cancel navigates back to view mode', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => screen.getByRole('button', { name: /cancel/i }));
            fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
            expect(pushMock).toHaveBeenCalledWith('/dashboard/quotes/quote-1');
        });

        it('removes an item when trash icon is clicked', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => expect(screen.getByText('Product Alpha')).toBeInTheDocument());
            const trashButtons = screen.getAllByRole('button').filter(
                (btn) => btn.querySelector('svg'),
            );
            // Find the one inside the items table (by class hint or position)
            const removeBtn = screen
                .getAllByRole('button')
                .find((btn) => btn.className.includes('text-gray-300'));
            if (removeBtn) {
                fireEvent.click(removeBtn);
                await waitFor(() => {
                    // Save Changes should now be disabled since no items
                    const saveBtn = screen.getByRole('button', { name: /save changes/i });
                    expect(saveBtn).toBeDisabled();
                });
            }
        });

        it('shows customer select dropdown in edit mode', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => {
                expect(screen.getByText('Walk-in Customer')).toBeInTheDocument();
                expect(screen.getByText('Test Customer')).toBeInTheDocument();
            });
        });

        it('shows valid until date input in edit mode', async () => {
            render(<QuoteDetailsPage />);
            await waitFor(() => {
                expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument();
            });
        });
    });
});
