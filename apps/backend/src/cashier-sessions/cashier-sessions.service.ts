import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';

@Injectable()
export class CashierSessionsService {
  constructor(private db: DatabaseService) {}

  async openSession(tenantId: string, userId: string, dto: OpenSessionDto) {
    // Check if user already has an open session
    const existingOpenSession = await this.db.cashierSession.findFirst({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        status: 'OPEN',
      },
    });

    if (existingOpenSession) {
      throw new BadRequestException('User already has an open cashier session');
    }

    return this.db.cashierSession.create({
      data: {
        tenant_id: tenantId,
        store_id: dto.storeId,
        user_id: userId,
        opening_cash: dto.openingCash,
        status: 'OPEN',
      },
    });
  }

  async closeSession(tenantId: string, sessionId: string, dto: CloseSessionDto) {
    const session = await this.db.cashierSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.tenant_id !== tenantId) {
      throw new BadRequestException('Session does not belong to this tenant');
    }

    if (session.status === 'CLOSED') {
      throw new BadRequestException('Session is already closed');
    }

    return this.db.cashierSession.update({
      where: { id: sessionId },
      data: {
        closed_at: new Date(),
        closing_cash: dto.closingCash,
        status: 'CLOSED',
      },
    });
  }

  async getOpenSessionByUser(tenantId: string, userId: string) {
    return this.db.cashierSession.findFirst({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        status: 'OPEN',
      },
    });
  }

  async getSessionsByStore(tenantId: string, storeId: string) {
    return this.db.cashierSession.findMany({
      where: {
        tenant_id: tenantId,
        store_id: storeId,
      },
      orderBy: {
        opened_at: 'desc',
      },
    });
  }

  async getSessionById(tenantId: string, sessionId: string) {
    const session = await this.db.cashierSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.tenant_id !== tenantId) {
      throw new BadRequestException('Session not found');
    }

    return session;
  }

  // Cash in/out tracking methods
  async addCashTransaction(tenantId: string, sessionId: string, amount: number, type: string, description?: string) {
    const session = await this.db.cashierSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.tenant_id !== tenantId) {
      throw new BadRequestException('Session does not belong to this tenant');
    }

    if (session.status !== 'OPEN') {
      throw new BadRequestException('Cannot add transaction to closed session');
    }

    return this.db.cashTransaction.create({
      data: {
        tenant_id: tenantId,
        session_id: sessionId,
        amount: amount,
        type: type,
        description: description,
      },
    });
  }

  async getCashTransactions(tenantId: string, sessionId: string) {
    const session = await this.db.cashierSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.tenant_id !== tenantId) {
      throw new BadRequestException('Session does not belong to this tenant');
    }

    return this.db.cashTransaction.findMany({
      where: {
        tenant_id: tenantId,
        session_id: sessionId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }
}