import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';
import { HotelResponseDto } from '../../hotels/dto';

@Exclude()
export class BookingResponseDto {
  @ApiProperty({ description: 'Booking UUID' })
  @Expose()
  declare id: string;

  @ApiProperty({ description: 'Hotel UUID' })
  @Expose()
  declare hotelId: string;

  @ApiProperty({ description: 'External booking reference' })
  @Expose()
  declare bookingReference: string;

  @ApiProperty({ description: 'Booking amount', type: Number })
  @Expose()
  declare amount: number;

  @ApiProperty({ description: 'Currency code' })
  @Expose()
  declare currency: string;

  @ApiProperty({ enum: BookingStatus, description: 'Booking status' })
  @Expose()
  declare status: BookingStatus;

  @ApiProperty({ description: 'Date of the booking' })
  @Expose()
  declare bookingDate: Date;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  @Expose()
  declare completedAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  declare createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  declare updatedAt: Date;

  @ApiPropertyOptional({ description: 'Related hotel', type: HotelResponseDto })
  @Expose()
  @Type(() => HotelResponseDto)
  declare hotel?: HotelResponseDto;
}
