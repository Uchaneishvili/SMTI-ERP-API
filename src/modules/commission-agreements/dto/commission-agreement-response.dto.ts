import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CommissionRateType } from '@prisma/client';

export class TierRuleResponseDto {
  @ApiProperty()
  @Expose()
  declare id: string;

  @ApiProperty()
  @Expose()
  declare minBookings: number;

  @ApiProperty({ required: false })
  @Expose()
  declare maxBookings: number | null;

  @ApiProperty()
  @Expose()
  declare bonusRate: number;
}

export class CommissionAgreementResponseDto {
  @ApiProperty()
  @Expose()
  declare id: string;

  @ApiProperty()
  @Expose()
  declare hotelId: string;

  @ApiProperty({ enum: CommissionRateType })
  @Expose()
  declare rateType: CommissionRateType;

  @ApiProperty()
  @Expose()
  declare baseRate: number;

  @ApiProperty({ required: false })
  @Expose()
  declare preferredBonusRate: number | null;

  @ApiProperty()
  @Expose()
  declare effectiveFrom: Date;

  @ApiProperty({ required: false })
  @Expose()
  declare effectiveUntil: Date | null;

  @ApiProperty()
  @Expose()
  declare isActive: boolean;

  @ApiProperty({ type: [TierRuleResponseDto] })
  @Expose()
  @Type(() => TierRuleResponseDto)
  declare tierRules: TierRuleResponseDto[];

  @ApiProperty()
  @Expose()
  declare createdAt: Date;
}
