import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export class PrismaErrorHandler {
  static handle(error: unknown, entityName = 'Record'): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          // Unique constraint violation
          const fields =
            (error.meta?.target as string[])?.join(', ') || 'field';
          throw new ConflictException(
            `${entityName} with this unique ${fields} already exists`,
          );

        case 'P2025':
          // Record not found
          throw new NotFoundException(`${entityName} not found`);

        case 'P2003':
          // Foreign key constraint failed
          throw new BadRequestException(
            `Invalid reference in ${entityName}. A related record does not exist.`,
          );

        default:
          // Other known Prisma errors
          throw new BadRequestException(`Database error: ${error.message}`);
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException(`Validation error: ${error.message}`);
    }

    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    console.error(error);
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
