export class PaginationUtil {
  static buildPagination(
    page: number,
    limit: number,
  ): { skip: number; take: number } {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, limit);

    return {
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
    };
  }
}
