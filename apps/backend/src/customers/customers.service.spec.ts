import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let db: any;

  beforeEach(async () => {
    db = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn()
      }
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
    await expect(service.findOne('t1', 'fake')).rejects.toThrow(BadRequestException);
  });
});
