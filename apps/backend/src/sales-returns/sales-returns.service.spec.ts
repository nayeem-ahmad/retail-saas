import { Test, TestingModule } from '@nestjs/testing';
import { SalesReturnsService } from './sales-returns.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';

describe('SalesReturnsService', () => {
  let service: SalesReturnsService;
  let db: any;

  beforeEach(async () => {
    db = {
      $transaction: jest.fn().mockImplementation(async (cb) => cb(db)),
      sale: {
          findUnique: jest.fn()
      },
      productStock: {
          updateMany: jest.fn()
      },
      salesReturn: {
          create: jest.fn(),
          findMany: jest.fn(),
          findFirst: jest.fn()
      },
      customer: {
          update: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesReturnsService,
        { provide: DatabaseService, useValue: db }
      ],
    }).compile();

    service = module.get<SalesReturnsService>(SalesReturnsService);
  });

  it('create() should process return completely and increment stock', async () => {
      const mockSale = {
          id: 'sale-1',
          customer_id: 'cust-1',
          items: [
              { id: 'item-1', product_id: 'p-1', quantity: 5, price_at_sale: 10, returns: [] }
          ]
      };
      db.sale.findUnique.mockResolvedValue(mockSale);
      db.salesReturn.create.mockResolvedValue({ id: 'return-99' });

      await service.create('tenant-1', {
          storeId: 'store-1',
          saleId: 'sale-1',
          items: [
              { saleItemId: 'item-1', quantity: 2 }
          ]
      });

      expect(db.productStock.updateMany).toHaveBeenCalledWith({
          where: { product_id: 'p-1', tenant_id: 'tenant-1' },
          data: { quantity: { increment: 2 } }
      });
      expect(db.customer.update).toHaveBeenCalledWith({
          where: { id: 'cust-1' },
          data: { total_spent: { decrement: 20 } } // 2 * 10
      });
  });

  it('create() should reject overly high returning quantities', async () => {
      const mockSale = {
        id: 'sale-1',
        items: [
            { id: 'item-1', product_id: 'p-1', quantity: 5, returns: [{ quantity: 4 }] }
        ]
    };
    db.sale.findUnique.mockResolvedValue(mockSale);

    await expect(service.create('tenant-1', {
        storeId: 'store-1',
        saleId: 'sale-1',
        items: [{ saleItemId: 'item-1', quantity: 2 }] // Attempting to return 2 but only 1 left.
    })).rejects.toThrow(BadRequestException);
  });

  it('create() should throw if sale not found', async () => {
    db.sale.findUnique.mockResolvedValue(null);
    await expect(service.create('tenant-1', { saleId: 'fake' } as any)).rejects.toThrow(BadRequestException);
  });

  it('findAll() should return all returns for a tenant', async () => {
    db.salesReturn.findMany.mockResolvedValue([{ id: 'ret-1' }]);
    const res = await service.findAll('tenant-1');
    expect(db.salesReturn.findMany).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-1' },
        include: { sale: true, items: { include: { product: true } } },
        orderBy: { created_at: 'desc' }
    });
    expect(res).toHaveLength(1);
  });

  it('findOne() should return a single return with details', async () => {
    db.salesReturn.findFirst.mockResolvedValue({ id: 'ret-1' });
    const res = await service.findOne('tenant-1', 'ret-1');
    expect(db.salesReturn.findFirst).toHaveBeenCalled();
    expect(res.id).toEqual('ret-1');
  });
});
