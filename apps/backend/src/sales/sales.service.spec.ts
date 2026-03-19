import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let db: any;
  let tx: any;

  beforeEach(async () => {
    tx = {
      sale: {
        create: jest.fn(),
      },
      saleItem: {
        create: jest.fn(),
      },
      productStock: {
        updateMany: jest.fn(),
      },
      customer: {
        update: jest.fn(),
      },
    };

    db = {
      $transaction: jest.fn().mockImplementation((cb) => cb(tx)),
      sale: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  describe('create() — Story 10.3: Atomic Sale Transaction', () => {
    it('should create a sale and atomically decrement stock', async () => {
      const sale = { id: 'sale-1', total_amount: 30 };
      tx.sale.create.mockResolvedValue(sale);
      tx.saleItem.create.mockResolvedValue({});
      tx.productStock.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.create('tenant-1', {
        storeId: 'store-1',
        totalAmount: 30,
        amountPaid: 30,
        items: [{ productId: 'prod-1', quantity: 2, priceAtSale: 15 }],
      });

      expect(tx.saleItem.create).toHaveBeenCalledWith({
        data: { sale_id: 'sale-1', product_id: 'prod-1', quantity: 2, price_at_sale: 15 },
      });
      expect(tx.productStock.updateMany).toHaveBeenCalledWith({
        where: { product_id: 'prod-1', quantity: { gte: 2 } },
        data: { quantity: { decrement: 2 } },
      });
      expect(result.id).toBe('sale-1');
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      tx.sale.create.mockResolvedValue({ id: 'sale-2' });
      tx.saleItem.create.mockResolvedValue({});
      tx.productStock.updateMany.mockResolvedValue({ count: 0 }); // no rows updated = insufficient stock

      await expect(
        service.create('tenant-1', {
          storeId: 'store-1',
          totalAmount: 15,
          amountPaid: 15,
          items: [{ productId: 'prod-low', quantity: 100, priceAtSale: 15 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update customer total_spent when customerId is provided', async () => {
      tx.sale.create.mockResolvedValue({ id: 'sale-3', total_amount: 50 });
      tx.saleItem.create.mockResolvedValue({});
      tx.productStock.updateMany.mockResolvedValue({ count: 1 });
      tx.customer.update.mockResolvedValue({});

      await service.create('tenant-1', {
        storeId: 'store-1',
        customerId: 'cust-1',
        totalAmount: 50,
        amountPaid: 50,
        items: [{ productId: 'prod-1', quantity: 1, priceAtSale: 50 }],
      });

      expect(tx.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: { total_spent: { increment: 50 } },
      });
    });

    it('should not update customer when no customerId', async () => {
      tx.sale.create.mockResolvedValue({ id: 'sale-4' });
      tx.saleItem.create.mockResolvedValue({});
      tx.productStock.updateMany.mockResolvedValue({ count: 1 });

      await service.create('tenant-1', {
        storeId: 'store-1',
        totalAmount: 20,
        amountPaid: 20,
        items: [{ productId: 'prod-1', quantity: 1, priceAtSale: 20 }],
      });

      expect(tx.customer.update).not.toHaveBeenCalled();
    });
  });

  describe('create() — Story 10.4: Advanced Payments (Split/Cards)', () => {
    it('should create a sale with split payment methods', async () => {
      const sale = { id: 'sale-5' };
      tx.sale.create.mockResolvedValue(sale);
      tx.saleItem.create.mockResolvedValue({});
      tx.productStock.updateMany.mockResolvedValue({ count: 1 });

      await service.create('tenant-1', {
        storeId: 'store-1',
        totalAmount: 100,
        amountPaid: 100,
        items: [{ productId: 'prod-1', quantity: 1, priceAtSale: 100 }],
        payments: [
          { paymentMethod: 'CASH', amount: 60 },
          { paymentMethod: 'BKASH', amount: 40 },
        ],
      });

      expect(tx.sale.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payments: {
            create: [
              { payment_method: 'CASH', amount: 60 },
              { payment_method: 'BKASH', amount: 40 },
            ],
          },
        }),
      });
    });

    it('should create a sale without explicit payments payload', async () => {
      tx.sale.create.mockResolvedValue({ id: 'sale-6' });
      tx.saleItem.create.mockResolvedValue({});
      tx.productStock.updateMany.mockResolvedValue({ count: 1 });

      await service.create('tenant-1', {
        storeId: 'store-1',
        totalAmount: 20,
        amountPaid: 20,
        items: [{ productId: 'prod-1', quantity: 1, priceAtSale: 20 }],
      });

      expect(tx.sale.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ payments: undefined }),
      });
    });

    it('should process multiple items atomically', async () => {
      tx.sale.create.mockResolvedValue({ id: 'sale-7' });
      tx.saleItem.create.mockResolvedValue({});
      tx.productStock.updateMany.mockResolvedValue({ count: 1 });

      await service.create('tenant-1', {
        storeId: 'store-1',
        totalAmount: 50,
        amountPaid: 50,
        items: [
          { productId: 'prod-A', quantity: 2, priceAtSale: 10 },
          { productId: 'prod-B', quantity: 3, priceAtSale: 10 },
        ],
      });

      expect(tx.saleItem.create).toHaveBeenCalledTimes(2);
      expect(tx.productStock.updateMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll()', () => {
    it('should return all sales for a tenant', async () => {
      db.sale.findMany.mockResolvedValue([{ id: 's1' }, { id: 's2' }]);

      const result = await service.findAll('tenant-1');

      expect(db.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenant_id: 'tenant-1' } }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne()', () => {
    it('should return a sale with items and payments', async () => {
      db.sale.findFirst.mockResolvedValue({ id: 's1', items: [], payments: [] });

      const result = await service.findOne('tenant-1', 's1');

      expect(result.id).toBe('s1');
    });

    it('should throw NotFoundException when sale does not exist', async () => {
      db.sale.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should update a sale note', async () => {
      db.sale.findFirst.mockResolvedValue({ id: 's1' });
      db.sale.update.mockResolvedValue({ id: 's1', note: 'Updated note' });

      const result = await service.update('tenant-1', 's1', { note: 'Updated note' });

      expect(db.sale.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { note: 'Updated note' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when sale to update is not found', async () => {
      db.sale.findFirst.mockResolvedValue(null);

      await expect(service.update('tenant-1', 'bad-id', { note: 'x' })).rejects.toThrow(NotFoundException);
    });
  });
});
