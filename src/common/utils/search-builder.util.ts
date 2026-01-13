export interface SearchOptions {
  search?: {
    query: string;
    fields: string[];
  };
  filter?: Record<string, any>; // Existing where clause
}

export class SearchBuilderUtil {
  static buildWhereClause(options: SearchOptions): Record<string, unknown> {
    const { search, filter } = options;
    const where: Record<string, unknown> = {};

    if (
      filter &&
      typeof filter === 'object' &&
      Object.keys(filter).length > 0
    ) {
      Object.assign(where, filter);
    }

    if (search?.query && search?.fields?.length) {
      const searchConditions = search.fields.map((field) => ({
        [field]: { contains: search.query, mode: 'insensitive' },
      }));

      if (Object.keys(where).length > 0) {
        return {
          AND: [where, { OR: searchConditions }],
        };
      } else {
        return {
          OR: searchConditions,
        };
      }
    }

    return where;
  }
}
