import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CommissionRateType,
  CommissionAgreement,
  TierRule,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionAgreementsService } from '../commission-agreements/commission-agreements.service';

type CommissionAgreementWithRules = CommissionAgreement & {
  tierRules: TierRule[];
};

interface TierBonusResult {
  bonus: Decimal;
  completedBookingsCount: number;
  matchedRule: TierRule | null;
}

@Injectable()
export class CommissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agreementsService: CommissionAgreementsService,
  ) {}

  async calculateCommission(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID "${bookingId}" not found`);
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Commission can only be calculated for completed bookings',
      );
    }

    const existingRecord = await this.prisma.commissionRecord.findUnique({
      where: { bookingId },
    });

    if (existingRecord) {
      return existingRecord;
    }

    const agreement = await this.agreementsService.findActiveAgreement(
      booking.hotelId,
    );

    if (!agreement) {
      throw new NotFoundException(
        `No active commission agreement found for hotel "${booking.hotel?.name ?? 'Unknown'}"`,
      );
    }

    const preferredBonus = this.calculatePreferredBonus(
      booking.hotel?.status,
      agreement,
    );
    const tierResult = await this.calculateTierBonus(
      booking.hotelId,
      bookingId,
      agreement as CommissionAgreementWithRules,
    );

    const baseRate = new Decimal(agreement.baseRate);
    const totalRate = baseRate.plus(preferredBonus).plus(tierResult.bonus);
    let commissionAmount = new Decimal(0);

    if (agreement.rateType === CommissionRateType.FLAT) {
      commissionAmount = baseRate;
    } else {
      commissionAmount = new Decimal(booking.amount).mul(totalRate);
    }

    commissionAmount = commissionAmount.toDecimalPlaces(2);

    const calculationDetails = {
      calculatedAt: new Date().toISOString(),
      hotel: {
        id: booking.hotelId,
        name: booking.hotel?.name,
        status: booking.hotel?.status,
      },
      booking: {
        id: booking.id,
        reference: booking.bookingReference,
        amount: booking.amount.toString(),
        currency: booking.currency,
        completedAt: booking.completedAt?.toISOString(),
      },
      agreement: {
        id: agreement.id,
        rateType: agreement.rateType,
        baseRate: agreement.baseRate.toString(),
        preferredBonusRate: agreement.preferredBonusRate?.toString() ?? null,
        effectiveFrom: agreement.effectiveFrom.toISOString(),
        effectiveUntil: agreement.effectiveUntil?.toISOString() ?? null,
      },
      calculation: {
        baseRate: baseRate.toString(),
        preferredBonusApplied: !preferredBonus.isZero(),
        preferredBonus: preferredBonus.toString(),
        tierBonusApplied: !tierResult.bonus.isZero(),
        tierBonus: tierResult.bonus.toString(),
        completedBookingsCount: tierResult.completedBookingsCount,
        matchedTierRule: tierResult.matchedRule
          ? {
              id: tierResult.matchedRule.id,
              minBookings: tierResult.matchedRule.minBookings,
              maxBookings: tierResult.matchedRule.maxBookings,
              bonusRate: tierResult.matchedRule.bonusRate.toString(),
            }
          : null,
        totalRate: totalRate.toString(),
        commissionAmount: commissionAmount.toString(),
      },
    };

    return this.prisma.commissionRecord.create({
      data: {
        bookingId: booking.id,
        agreementId: agreement.id,
        bookingAmount: booking.amount,
        currency: booking.currency,
        baseRate: baseRate,
        preferredBonus: preferredBonus,
        tierBonus: tierResult.bonus,
        totalRate: totalRate,
        commissionAmount: commissionAmount,
        calculationDetails: calculationDetails,
        calculatedAt: new Date(),
      },
    });
  }

  private calculatePreferredBonus(
    hotelStatus: string | undefined,
    agreement: CommissionAgreement,
  ): Decimal {
    if (hotelStatus === 'PREFERRED' && agreement.preferredBonusRate) {
      return new Decimal(agreement.preferredBonusRate);
    }
    return new Decimal(0);
  }

  private async calculateTierBonus(
    hotelId: string,
    currentBookingId: string,
    agreement: CommissionAgreementWithRules,
  ): Promise<TierBonusResult> {
    if (agreement.rateType !== CommissionRateType.TIERED) {
      return {
        bonus: new Decimal(0),
        completedBookingsCount: 0,
        matchedRule: null,
      };
    }

    const completedCount = await this.prisma.booking.count({
      where: {
        hotelId: hotelId,
        status: 'COMPLETED',
        id: { not: currentBookingId },
      },
    });

    const matchedRule =
      agreement.tierRules.find((rule) => {
        const minOk = rule.minBookings <= completedCount;
        const maxOk =
          rule.maxBookings === null || rule.maxBookings >= completedCount;
        return minOk && maxOk;
      }) ?? null;

    return {
      bonus: matchedRule ? new Decimal(matchedRule.bonusRate) : new Decimal(0),
      completedBookingsCount: completedCount,
      matchedRule,
    };
  }
}
