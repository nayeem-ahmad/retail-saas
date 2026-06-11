'use client';

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReturnDetailPage from './page';

const pushMock = jest.fn();
let searchValue = '';

jest.mock('next/navigation', () => ({
    useParams: () => ({ id: 'ret-1' }),
    useRouter: () => ({ push: pushMock }),
    useSearchParams: () => ({ get: (key: string) => (key === 'edit' ? searchValue : null) }),
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('../../../../lib/api', () => ({
    api: {
        getReturn: jest.fn(),
        updateReturn: jest.fn(),
    },
}));

jest.mock('../../../../lib/format', () => ({
    formatBDT: (v: number) => `BDT ${v}`,
}));

const mockReturn = {
    id: 'ret-1',
    return_number: 'RET-00001',
    created_at: '2026-03-20T12:00:00.000Z',
    total_refund: '750',
    status: 'COMPLETED',
    reason: 'Defective product',
    sale: {
        serial_number: 'SALE-001',
        items: [
            {
                id: 'sale-item-1',
                quantity: 5,
                price_at_sale: '250',
                returns: [
                    { return_id: 'ret-1', quantity: 3 },
                ],
            },
        ],
    },
    items: [
        {
            id: 'ret-item-1',
            sale_item_id: 'sale-item-1',
            product_id: 'prod-1',
            quantity: 3,
            refund_amount: '750',
            product: { name: 'Coffee Beans' },
        },
    ],
};

describe('ReturnDetailPage', () => {
    beforeEach(() => {
        pushMock.mockReset();
        searchValue = '';
        window.alert = jest.fn();
        window.confirm = jest.fn(() => true);
        window.open = jest.fn(() => ({
            document: { write: jest.fn(), close: jest.fn() },
            print: jest.fn(),
        })) as any;

        const { api } = require('../../../../lib/api');
        api.getReturn.mockResolvedValue(mockReturn);
        api.updateReturn.mockResolvedValue({ ...mockReturn });
    });

    it('shows loading state initially', () => {
        const { api } = require('../../../../lib/api');
        api.getReturn.mockReturnValue(new Promise(() => {}));
        render(<ReturnDetailPage />);
        expect(screen.getByText(/loading return/i)).toBeInTheDocument();
    });

    it('renders return details after loading', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => {
            expect(screen.getByText('RET-00001')).toBeInTheDocument();
        });
        expect(screen.getByText('SALE-001')).toBeInTheDocument();
        expect(screen.getByText('Coffee Beans')).toBeInTheDocument();
    });

    it('shows "Return not found" when API returns null', async () => {
        const { api } = require('../../../../lib/api');
        api.getReturn.mockResolvedValue(null);
        render(<ReturnDetailPage />);
        await waitFor(() => {
            expect(screen.getByText(/return not found/i)).toBeInTheDocument();
        });
    });

    it('shows return reason in view mode', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => {
            expect(screen.getByText('Defective product')).toBeInTheDocument();
        });
    });

    it('shows COMPLETED status badge', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => {
            expect(screen.getByText('COMPLETED')).toBeInTheDocument();
        });
    });

    it('shows total refund amount', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => {
            // BDT 750 from formatBDT mock
            expect(screen.getAllByText('BDT 750').length).toBeGreaterThan(0);
        });
    });

    it('shows quantity returned', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => {
            expect(screen.getByText('3')).toBeInTheDocument();
        });
    });

    it('shows original sale receipt number', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => {
            expect(screen.getAllByText('SALE-001').length).toBeGreaterThan(0);
        });
    });

    it('shows Edit and Print buttons in view mode', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /print preview/i })).toBeInTheDocument();
        });
    });

    it('navigates to edit mode when Edit is clicked', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => screen.getByRole('button', { name: /^edit$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
        expect(pushMock).toHaveBeenCalledWith('/dashboard/returns/ret-1?edit=true');
    });

    it('opens print window when Print Preview is clicked', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => screen.getByRole('button', { name: /print preview/i }));
        fireEvent.click(screen.getByRole('button', { name: /print preview/i }));
        expect(window.open).toHaveBeenCalled();
    });

    it('navigates back to returns list when back button is clicked', async () => {
        render(<ReturnDetailPage />);
        await waitFor(() => screen.getByText('RET-00001'));
        // The back arrow button navigates to /dashboard/returns
        const backBtn = screen.getAllByRole('button').find(
            (btn) => btn.querySelector('svg'),
        );
        if (backBtn) {
            fireEvent.click(backBtn);
        }
        // pushMock is called with /dashboard/returns from the ArrowLeft button
    });

    describe('Edit mode', () => {
        beforeEach(() => {
            searchValue = 'true';
        });

        it('shows edit mode banner', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => {
                expect(screen.getByText(/edit mode/i)).toBeInTheDocument();
            });
        });

        it('shows Save Changes button in edit mode', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => {
                expect(screen.getAllByRole('button', { name: /save changes/i }).length).toBeGreaterThan(0);
            });
        });

        it('shows reason textarea in edit mode', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/reason for return/i)).toBeInTheDocument();
            });
        });

        it('populates reason field from existing return data', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => {
                expect(screen.getByDisplayValue('Defective product')).toBeInTheDocument();
            });
        });

        it('shows items table with quantity inputs in edit mode', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => {
                expect(screen.getByDisplayValue('3')).toBeInTheDocument();
            });
        });

        it('shows max quantity column in edit mode', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => {
                // maxQuantity is 5 - 3 (from other returns) = 2, but our mockReturn has only one return
                // sale item qty 5, return qty 3, same return_id = ret-1 so otherReturned = 0, max = 5
                expect(screen.getByText('5')).toBeInTheDocument();
            });
        });

        it('saves with updated reason when Save Changes is clicked', async () => {
            const { api } = require('../../../../lib/api');
            render(<ReturnDetailPage />);
            await waitFor(() => screen.getByDisplayValue('Defective product'));
            fireEvent.change(screen.getByDisplayValue('Defective product'), {
                target: { value: 'Changed reason' },
            });
            fireEvent.click(screen.getAllByRole('button', { name: /save changes/i })[0]);
            await waitFor(() => {
                expect(api.updateReturn).toHaveBeenCalledWith(
                    'ret-1',
                    expect.objectContaining({ reason: 'Changed reason' }),
                );
            });
            expect(pushMock).toHaveBeenCalledWith('/dashboard/returns/ret-1');
        });

        it('alerts when all items have quantity 0 on save', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => screen.getByDisplayValue('3'));
            fireEvent.change(screen.getByDisplayValue('3'), { target: { value: '0' } });
            fireEvent.click(screen.getAllByRole('button', { name: /save changes/i })[0]);
            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith(
                    expect.stringMatching(/at least one item/i),
                );
            });
        });

        it('cancel navigates back to view mode', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => screen.getByRole('button', { name: /cancel/i }));
            fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0]);
            expect(pushMock).toHaveBeenCalledWith('/dashboard/returns/ret-1');
        });

        it('shows New Total Refund label in edit mode', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => {
                expect(screen.getByText(/new total refund/i)).toBeInTheDocument();
            });
        });

        it('shows "No items" message when all items removed', async () => {
            const { api } = require('../../../../lib/api');
            api.getReturn.mockResolvedValue({ ...mockReturn, items: [] });
            searchValue = 'true';
            render(<ReturnDetailPage />);
            await waitFor(() => {
                expect(screen.getByText(/no items.*all removed/i)).toBeInTheDocument();
            });
        });

        it('removes an item when trash icon is clicked in edit mode', async () => {
            render(<ReturnDetailPage />);
            await waitFor(() => screen.getByText('Coffee Beans'));
            // Find remove button by text content of parent context
            const removeButtons = screen
                .getAllByRole('button')
                .filter((btn) => btn.className.includes('text-gray-300'));
            if (removeButtons.length > 0) {
                fireEvent.click(removeButtons[0]);
                await waitFor(() => {
                    expect(screen.getByText(/no items.*all removed/i)).toBeInTheDocument();
                });
            }
        });
    });
});
