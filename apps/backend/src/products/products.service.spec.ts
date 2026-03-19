import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let db: any;
  let tx: any;

  beforeEach(async () => {
    tx = {
      product: {
        create: jest.fn(),
      },
      productStock: {
        create: jest.fn(),
      },
    };

    db = {
      $transaction: jest.fn().mockImplementation((cb) => cb(tx)),
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create()', () => {
    it('should create a product with initial stock', async () => {
      const product = { id: 'prod-1', name: 'Coffee', sku: 'CF-001', price: 10 };
      tx.product.create.mockResolvedValue(product);
      tx.productStock.create.mockResolvedValue({ id: 'stock-1', quantity: 50 });

      const result = await service.create('tenant-1', {
        name: 'Coffee',
        sku: 'CF-001',
        price: 10,
        initialStock: 50,
      });

      expect(tx.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tenant_id: 'tenant-1', name: 'Coffee', price: 10 }),
      });
      expect(tx.productStock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ product_id: 'prod-1', quantity: 50 }),
      });
      expect(result.id).toBe('prod-1');
    });

    it('should create a product without initial stock', async () => {
      const product = { id: 'prod-2', name: 'Tea', sku: 'T-001', price: 5 };
      tx.product.create.mockResolvedValue(product);

      const result = await service.create('tenant-1', {
        name: 'Tea',
        sku: 'T-001',
        price: 5,
      });

      expect(tx.product.create).toHaveBeenCalled();
      expect(tx.productStock.create).not.toHaveBeenCalled();
      expect(result.id).toBe('prod-2');
    });
  });

  describe('findAll()', () => {
    it('should return all products for the tenant', async () => {
      db.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'A', stocks: [] },
        { id: 'p2', name: 'B', stocks: [] },
      ]);

      const result = await service.findAll('tenant-1');

      expect(db.product.findMany).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-1' },
        include: { stocks: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne()', () => {
    it('should return a single product', async () => {
      db.product.findFirst.mockResolvedValue({ id: 'p1', stocks: [] });

      const result = await service.findOne('tenant-1', 'p1');

      expect(result.id).toBe('p1');
    });

    it('should throw NotFoundException when product not found', async () => {
      db.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should update a product by tenant and id', async () => {
      db.product.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.update('tenant-1', 'p1', { name: 'Updated' });

      expect(db.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'p1', tenant_id: 'tenant-1' },
        data: { name: 'Updated' },
      });
      expect(result.count).toBe(1);
    });
  });

  describe('remove()', () => {
    it('should delete a product by tenant and id', async () => {
      db.product.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove('tenant-1', 'p1');

      expect(db.product.deleteMany).toHaveBeenCalledWith({
        where: { id: 'p1', tenant_id: 'tenant-1' },
      });
      expect(result.count).toBe(1);
    });
  });
});
