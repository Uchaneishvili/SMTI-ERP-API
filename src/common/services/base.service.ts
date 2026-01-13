import { NotFoundException } from '@nestjs/common';
import { PrismaErrorHandler } from '../utils/prisma-error.util';
import { SearchBuilderUtil } from '../utils/search-builder.util';
import { PaginationUtil } from '../utils/pagination.util';

export interface CrudDelegate<T> {
  findMany(args?: any): Promise<T[]>;
  findUnique(args: any): Promise<T | null>;
  create(args: any): Promise<T>;
  update(args: any): Promise<T>;
  delete(args: any): Promise<T>;
}

export abstract class BaseService<T> {
  constructor(
    protected readonly model: CrudDelegate<T>,
    protected readonly entityName: string,
  ) {}

  protected handleError(error: unknown): never {
    PrismaErrorHandler.handle(error, this.entityName);
  }

  async create(data: any): Promise<T> {
    try {
      return await this.model.create({ data });
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(params?: {
    pagination?: { page: number; limit: number };
    search?: { query: string; fields: string[] };
    [key: string]: any;
  }): Promise<T[]> {
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
      orderBy: { createdAt: 'desc' } as any,
      ...otherParams,
      where,
    });
  }

  async findOne(id: string): Promise<T> {
    const item = await this.model.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(
        `${this.entityName} with ID "${id}" not found`,
      );
    }

    return item;
  }

  async update(id: string, data: any): Promise<T> {
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
