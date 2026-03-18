import { Test, TestingModule } from '@nestjs/testing';
import { SalesQuotationsService } from './sales-quotations.service';
import { DatabaseService } from '../database/database.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { BadRequestException } from '@nestjs/common';

describe('SalesQuotationsService', () => {
  let service: SalesQuotationsService;
  let db: any;
  let ordersService: any;

  beforeEach(async () => {
    db = {
      $transaction: jest.fn().mockImplementation(async (cb) => cb(db)),
      quotation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn()
      }
    };

    ordersService = {
        create: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesQuotationsService,
        { provide: DatabaseService, useValue: db },
        { provide: SalesOrdersService, useValue: ordersService }
      ],
    }).compile();

    service = module.get<SalesQuotationsService>(SalesQuotationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should successfully create a quotation', async () => {
    const mockDto = {
        storeId: 'store-1',
        totalAmount: 500,
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 500 }]
    };
    db.quotation.create.mockResolvedValue({ id: 'quote-1' });

    const result = await service.create('tenant-1', mockDto as any);
    expect(db.quotation.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'quote-1' });
  });

  it('revise() should duplicate a specific quote keeping status updated', async () => {
    const oldQuote = {
        id: 'quote-1',
        version: 1,
        status: 'DRAFT',
        items: [{ product_id: 'prod-1', quantity: 1, unit_price: 100 }]
    };
    
    db.quotation.findUnique.mockResolvedValue(oldQuote);
    db.quotation.create.mockResolvedValue({ id: 'quote-2', version: 2 });

    const result = await service.revise('tenant-1', 'quote-1');
    expect(db.quotation.update).toHaveBeenCalledWith({
        where: { id: 'quote-1' },
        data: { status: 'REVISED' }
    });
    expect(db.quotation.create).toHaveBeenCalled();
    expect(result.version).toEqual(2);
  });

  it('revise() should throw if quote is already accepted or converted', async () => {
      db.quotation.findUnique.mockResolvedValue({ status: 'ACCEPTED' });
      await expect(service.revise('t1', 'q1')).rejects.toThrow(BadRequestException);
  });

  it('convertToOrder() should pipe items to SalesOrdersService', async () => {
      const confirmedQuote = {
          id: 'quote-2',
          status: 'ACCEPTED',
          total_amount: 100,
          items: [{ product_id: 'prod-1', quantity: 1, unit_price: 100 }]
      };

      db.quotation.findUnique.mockResolvedValue(confirmedQuote);
      ordersService.create.mockResolvedValue({ id: 'order-99' });

      const result = await service.convertToOrder('tenant-1', 'quote-2');
      
      expect(ordersService.create).toHaveBeenCalled();
      expect(db.quotation.update).toHaveBeenCalledWith({
          where: { id: 'quote-2' },
          data: { status: 'CONVERTED' }
      });
      expect(result.id).toEqual('order-99');
  });

  it('convertToOrder() should throw if already converted', async () => {
      db.quotation.findUnique.mockResolvedValue({ status: 'CONVERTED' });
      await expect(service.convertToOrder('tenant-1', 'fake-id')).rejects.toThrow(BadRequestException);
  });

  it('findAll() should return all quotes for a tenant', async () => {
    db.quotation.findMany.mockResolvedValue([{ id: 'q-1' }]);
    const res = await service.findAll('tenant-1');
    expect(db.quotation.findMany).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-1' },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { created_at: 'desc' }
    });
    expect(res).toHaveLength(1);
  });

  it('findOne() should return a single quote with details', async () => {
    db.quotation.findFirst.mockResolvedValue({ id: 'q-1' });
    const res = await service.findOne('tenant-1', 'q-1');
    expect(db.quotation.findFirst).toHaveBeenCalled();
    expect(res.id).toEqual('q-1');
  });

  it('updateStatus() should change status of a quote', async () => {
    db.quotation.update.mockResolvedValue({ id: 'q-1', status: 'SENT' });
    const res = await service.updateStatus('tenant-1', 'q-1', { status: 'SENT' });
    expect(db.quotation.update).toHaveBeenCalled();
    expect(res.status).toEqual('SENT');
  });
});
