import { paginate, PaginatedResult } from './pagination.dto';

export async function paginatedFindMany<T>(input: {
    findMany: (args: Record<string, unknown>) => Promise<T[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
    where: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    page?: number;
    limit?: number;
}): Promise<PaginatedResult<T>> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        input.findMany({
            where: input.where,
            orderBy: input.orderBy,
            skip,
            take: limit,
        }),
        input.count({ where: input.where }),
    ]);

    return paginate(items, total, page, limit);
}