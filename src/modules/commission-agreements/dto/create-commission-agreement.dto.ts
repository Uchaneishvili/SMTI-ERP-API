import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionRateType } from '@prisma/client';

export class CreateTierRuleDto {
  @ApiProperty({ description: 'Minimum bookings to qualify' })
  @IsNumber()
  declare minBookings: number;

  @ApiPropertyOptional({ description: 'Maximum bookings to qualify' })
  @IsOptional()
  @IsNumber()
  declare maxBookings?: number;

  @ApiProperty({ description: 'Bonus rate for this tier (e.g., 0.01 for 1%)' })
  @IsNumber()
  declare bonusRate: number;
}

export class CreateCommissionAgreementDto {
  @ApiProperty({ description: 'Hotel ID' })
  @IsUUID()
  declare hotelId: string;

  @ApiProperty({
    enum: CommissionRateType,
    description: 'Type of commission rate',
  })
  @IsEnum(CommissionRateType)
  declare rateType: CommissionRateType;

  @ApiProperty({ description: 'Base commission rate (e.g. 0.10 for 10%)' })
  @IsNumber()
  declare baseRate: number;

  @ApiPropertyOptional({ description: 'Preferred bonus rate' })
  @IsOptional()
  @IsNumber()
  preferredBonusRate?: number;

  @ApiPropertyOptional({ description: 'Effective start date' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective end date' })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Is agreement active?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [CreateTierRuleDto],
    description: 'Tier rules for tiered rates',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTierRuleDto)
  tierRules?: CreateTierRuleDto[];
}
