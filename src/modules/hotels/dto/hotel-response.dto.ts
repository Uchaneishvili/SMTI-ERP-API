import { ApiProperty } from '@nestjs/swagger';
import { HotelStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class HotelResponseDto {
  @ApiProperty({ description: 'Hotel UUID' })
  @Expose()
  declare id: string;

  @ApiProperty({ description: 'Hotel name' })
  @Expose()
  declare name: string;

  @ApiProperty({ enum: HotelStatus, description: 'Hotel status' })
  @Expose()
  declare status: HotelStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  declare createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  declare updatedAt: Date;

  constructor(partial: Partial<HotelResponseDto>) {
    Object.assign(this, partial);
  }
}
