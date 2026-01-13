import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'Booking status',
    enum: BookingStatus,
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  declare status?: BookingStatus;

  @ApiPropertyOptional({
    description:
      'Completion date (set automatically when status changes to COMPLETED)',
    example: '2026-01-20T15:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  declare completedAt?: string;
}
