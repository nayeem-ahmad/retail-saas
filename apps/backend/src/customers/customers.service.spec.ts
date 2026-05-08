import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let db: any;

  beforeEach(async () => {
    db = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      sale: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: DatabaseService, useValue: db }
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should allow creation of new customer if phone unique', async () => {
      db.customer.findUnique.mockResolvedValue(null);
      db.customer.findFirst.mockResolvedValue(null);
      db.customer.create.mockResolvedValue({ id: 'cust-1' });

      const res = await service.create('tenant-1', {
          name: 'Nayeem', phone: '+123', email: '', address: ''
      });
      expect(res.id).toEqual('cust-1');
  });

  it('should throw Error when phone matches existing customer', async () => {
      db.customer.findUnique.mockResolvedValue({ id: 'existing-cust' });

      await expect(service.create('tenant-1', { name: 'Oops', phone: '+123' } as any)).rejects.toThrow(BadRequestException);
  });

  it('findAll() should return all customers', async () => {
    db.customer.findMany.mockResolvedValue([{ id: 'c1' }]);
    const res = await service.findAll('t1');
    expect(res).toHaveLength(1);
  });

  it('findOne() should return details', async () => {
    db.customer.findFirst.mockResolvedValue({ id: 'c1' });
    const res = await service.findOne('t1', 'c1');
    expect(res.id).toEqual('c1');
  });

  it('findOne() should throw if not found', async () => {
    db.customer.findFirst.mockResolvedValue(null);
    await expect(service.findOne('t1', 'fake')).rejects.toThrow(NotFoundException);
  });

  describe('getHistory()', () => {
    it('returns structured history with summary and topProducts', async () => {
      db.customer.findFirst.mockResolvedValue({
        id: 'c1', name: 'Alice', customer_code: 'CUST-00001',
        segment_category: 'Regular', total_spent: 1500, created_at: new Date('2025-01-01'),
      });
      db.sale.findMany.mockResolvedValue([
        {
          id: 's1', total_amount: 1000, created_at: new Date('2026-04-01'),
          items: [
            { id: 'i1', quantity: 2, price_at_sale: 300, product: { name: 'Widget' } },
            { id: 'i2', quantity: 1, price_at_sale: 400, product: { name: 'Gadget' } },
          ],
        },
        {
          id: 's2', total_amount: 500, created_at: new Date('2026-03-01'),
          items: [
            { id: 'i3', quantity: 3, price_at_sale: 100, product: { name: 'Widget' } },
          ],
        },
      ]);

      const result = await service.getHistory('t1', 'c1');

      expect(result.summary.totalOrders).toBe(2);
      expect(result.summary.avgOrderValue).toBe(750);
      expect(result.summary.lastPurchaseDate).toEqual(new Date('2026-04-01'));
      expect(result.topProducts[0].name).toBe('Widget');
      expect(result.topProducts[0].qty).toBe(5);
      expect(result.sales).toHaveLength(2);
    });

    it('returns zero-value summary when customer has no sales', async () => {
      db.customer.findFirst.mockResolvedValue({
        id: 'c2', name: 'Bob', customer_code: 'CUST-00002',
        segment_category: 'New', total_spent: 0, created_at: new Date('2026-04-20'),
      });
      db.sale.findMany.mockResolvedValue([]);

      const result = await service.getHistory('t1', 'c2');

      expect(result.summary.totalOrders).toBe(0);
      expect(result.summary.avgOrderValue).toBe(0);
      expect(result.summary.lastPurchaseDate).toBeNull();
      expect(result.topProducts).toHaveLength(0);
    });

    it('throws NotFoundException when customer does not exist', async () => {
      db.customer.findFirst.mockResolvedValue(null);
      await expect(service.getHistory('t1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
