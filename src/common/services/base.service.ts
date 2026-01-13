import { NotFoundException } from '@nestjs/common';
import { PrismaErrorHandler } from '../utils/prisma-error.util';
import { SearchBuilderUtil } from '../utils/search-builder.util';
import { PaginationUtil } from '../utils/pagination.util';

export interface CrudDelegate<T> {
  findMany(args?: unknown): Promise<T[]>;
  findUnique(args: unknown): Promise<T | null>;
  create(args: unknown): Promise<T>;
  update(args: unknown): Promise<T>;
  delete(args: unknown): Promise<T>;
}

export interface QueryParams {
  pagination?: { page: number; limit: number };
  search?: { query: string; fields: string[] };
  include?: Record<string, unknown>;
  where?: Record<string, unknown>;
  [key: string]: unknown;
}

export abstract class BaseService<T, C = unknown, U = unknown> {
  constructor(
    protected readonly model: CrudDelegate<T>,
    protected readonly entityName: string,
  ) {}

  protected handleError(error: unknown): never {
    PrismaErrorHandler.handle(error, this.entityName);
  }

  async create(data: C, options: Record<string, any> = {}): Promise<T> {
    try {
      return await this.model.create({ data, ...options });
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(params?: QueryParams): Promise<T[]> {
    const { pagination, search, ...otherParams } = params || {};

    // Pagination logic
    const { skip, take } = pagination
      ? PaginationUtil.buildPagination(pagination.page, pagination.limit)
      : { skip: undefined, take: undefined };

    // Search logic
    const where = SearchBuilderUtil.buildWhereClause({
      search,
      filter: otherParams.where,
    });

    return this.model.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      ...otherParams,
      where,
    });
  }

  async findOne(id: string, options: Record<string, any> = {}): Promise<T> {
    const item = await this.model.findUnique({
      where: { id },
      ...options,
    });

    if (!item) {
      throw new NotFoundException(
        `${this.entityName} with ID "${id}" not found`,
      );
    }

    return item;
  }

  async update(id: string, data: U): Promise<T> {
    await this.findOne(id);

    try {
      return await this.model.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(id: string): Promise<T> {
    await this.findOne(id);

    try {
      return await this.model.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
