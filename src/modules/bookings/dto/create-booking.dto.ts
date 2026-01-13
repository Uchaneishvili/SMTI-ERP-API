import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Hotel UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  declare hotelId: string;

  @ApiProperty({
    description: 'External booking reference number',
    example: 'BK-2026-001234',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare bookingReference: string;

  @ApiProperty({
    description: 'Booking amount',
    example: 1500.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declare amount: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'CHF',
    default: 'CHF',
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  declare currency?: string;

  @ApiProperty({
    description: 'Date of the booking (ISO 8601)',
    example: '2026-01-15T10:00:00Z',
  })
  @IsDateString()
  declare bookingDate: string;
}
