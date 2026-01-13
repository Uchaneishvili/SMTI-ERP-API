import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HotelStatus } from '@prisma/client';

export class CreateHotelDto {
  @ApiProperty({
    description: 'Hotel name',
    example: 'Grand Hotel Zurich',
  })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiPropertyOptional({
    description: 'Hotel status',
    enum: HotelStatus,
    default: HotelStatus.STANDARD,
  })
  @IsEnum(HotelStatus)
  @IsOptional()
  declare status?: HotelStatus;
}
