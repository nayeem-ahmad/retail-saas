'use client';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PurchaseReturnsPage from './page';

jest.mock('../../../lib/api', () => ({
    api: {
        getPurchaseReturns: jest.fn(),
        getPurchases: jest.fn(),
        createPurchaseReturn: jest.fn(),
    },
}));

describe('PurchaseReturnsPage — Epic 21: Purchase Returns List & Creation UI', () => {
    beforeEach(() => {
        const { api } = require('../../../lib/api');
        api.getPurchaseReturns.mockResolvedValue([
            {
                id: 'pret-1',
                return_number: 'PRET-00001',
                created_at: '2026-03-20T12:00:00.000Z',
                total_amount: 24,
                supplier: { name: 'Fresh Farms' },
                purchase: { id: 'purchase-1', purchase_number: 'PUR-00001' },
                items: [{ id: 'line-1' }],
            },
        ]);
        api.getPurchases.mockResolvedValue([
            {
                id: 'purchase-1',
                purchase_number: 'PUR-00001',
                created_at: '2026-03-19T10:00:00.000Z',
                total_amount: 80,
                store_id: 'store-1',
                supplier: { name: 'Fresh Farms' },
                items: [
                    {
                        id: 'item-1',
                        quantity: 5,
                        unit_cost: 12,
                        product_id: 'prod-1',
                        product: { name: 'Coffee Beans', sku: 'CB-001' },
                        returnItems: [{ id: 'old-return', quantity: 1 }],
                    },
                ],
            },
        ]);
        api.createPurchaseReturn.mockResolvedValue({ id: 'pret-2' });
    });

    it('renders purchase returns loaded from the API', async () => {
        render(<PurchaseReturnsPage />);

        await waitFor(() => {
            expect(screen.getByText('PRET-00001')).toBeInTheDocument();
            expect(screen.getByText('PUR-00001')).toBeInTheDocument();
            expect(screen.getByText('Fresh Farms')).toBeInTheDocument();
        });
    });

    it('creates a purchase return from a selected purchase', async () => {
        const { api } = require('../../../lib/api');

        render(<PurchaseReturnsPage />);

        fireEvent.click(screen.getByRole('button', { name: /new return/i }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'New Purchase Return' })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /pur-00001/i }));

        await waitFor(() => {
            expect(screen.getByText('Returnable Purchase Lines')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: /create purchase return/i }));

        await waitFor(() => {
            expect(api.createPurchaseReturn).toHaveBeenCalledWith(
                expect.objectContaining({
                    storeId: 'store-1',
                    purchaseId: 'purchase-1',
                    items: [{ purchaseItemId: 'item-1', quantity: 2 }],
                }),
            );
        });
    });
});