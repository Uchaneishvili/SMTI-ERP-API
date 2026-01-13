import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateCommissionDto {
  @ApiProperty({
    description: 'The UUID of the booking to calculate commission for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bookingId!: string;
}

export * from './month-query.dto';
