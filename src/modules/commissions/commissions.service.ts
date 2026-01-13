import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommissionRateType, CommissionAgreement } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionAgreementsService } from '../commission-agreements/commission-agreements.service';

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

    // Use centralized logic to find agreement
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
    const tierBonus = await this.calculateTierBonus(
      booking.hotelId,
      bookingId,
      agreement as CommissionAgreement & { tierRules: any[] },
    );

    // Calculate Total Rate and Amount
    const baseRate = new Decimal(agreement.baseRate);
    const totalRate = baseRate.plus(preferredBonus).plus(tierBonus);
    let commissionAmount = new Decimal(0);

    if (agreement.rateType === CommissionRateType.FLAT) {
      commissionAmount = baseRate;
    } else {
      commissionAmount = new Decimal(booking.amount).mul(totalRate);
    }

    commissionAmount = commissionAmount.toDecimalPlaces(2);

    return this.prisma.commissionRecord.create({
      data: {
        bookingId: booking.id,
        agreementId: agreement.id,
        bookingAmount: booking.amount,
        currency: booking.currency,
        baseRate: baseRate,
        preferredBonus: preferredBonus,
        tierBonus: tierBonus,
        totalRate: totalRate,
        commissionAmount: commissionAmount,
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
    agreement: CommissionAgreement & { tierRules: any[] },
  ): Promise<Decimal> {
    if (agreement.rateType !== CommissionRateType.TIERED) {
      return new Decimal(0);
    }

    const completedCount = await this.prisma.booking.count({
      where: {
        hotelId: hotelId,
        status: 'COMPLETED',
        id: { not: currentBookingId },
      },
    });

    const matchedRule = agreement.tierRules.find((rule: any) => {
      const minOk = rule.minBookings <= completedCount;
      const maxOk =
        rule.maxBookings === null || rule.maxBookings >= completedCount;
      return minOk && maxOk;
    });

    return matchedRule ? new Decimal(matchedRule.bonusRate) : new Decimal(0);
  }
}
