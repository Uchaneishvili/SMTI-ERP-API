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

  private getMonthDateRange(month: string): { startDate: Date; endDate: Date } {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1);
    return { startDate, endDate };
  }

  async getMonthlySummary(month: string) {
    const { startDate, endDate } = this.getMonthDateRange(month);

    const records = await this.prisma.commissionRecord.findMany({
      where: {
        calculatedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        booking: {
          include: { hotel: true },
        },
        agreement: true,
      },
    });

    const hotelSummaries = new Map<
      string,
      {
        hotelId: string;
        hotelName: string;
        hotelStatus: string;
        totalBookings: number;
        totalBookingAmount: Decimal;
        totalCommission: Decimal;
        averageRate: Decimal;
      }
    >();

    let grandTotalBookings = 0;
    let grandTotalBookingAmount = new Decimal(0);
    let grandTotalCommission = new Decimal(0);

    for (const record of records) {
      const hotelId = record.booking.hotelId;
      const hotelName = record.booking.hotel?.name ?? 'Unknown';
      const hotelStatus = record.booking.hotel?.status ?? 'STANDARD';

      if (!hotelSummaries.has(hotelId)) {
        hotelSummaries.set(hotelId, {
          hotelId,
          hotelName,
          hotelStatus,
          totalBookings: 0,
          totalBookingAmount: new Decimal(0),
          totalCommission: new Decimal(0),
          averageRate: new Decimal(0),
        });
      }

      const summary = hotelSummaries.get(hotelId)!;
      summary.totalBookings += 1;
      summary.totalBookingAmount = summary.totalBookingAmount.plus(
        record.bookingAmount,
      );
      summary.totalCommission = summary.totalCommission.plus(
        record.commissionAmount,
      );

      grandTotalBookings += 1;
      grandTotalBookingAmount = grandTotalBookingAmount.plus(
        record.bookingAmount,
      );
      grandTotalCommission = grandTotalCommission.plus(record.commissionAmount);
    }

    const hotels = Array.from(hotelSummaries.values()).map((h) => ({
      ...h,
      totalBookingAmount: h.totalBookingAmount.toNumber(),
      totalCommission: h.totalCommission.toNumber(),
      averageRate: h.totalBookingAmount.isZero()
        ? 0
        : h.totalCommission.div(h.totalBookingAmount).toNumber(),
    }));

    return {
      month,
      period: {
        from: startDate.toISOString(),
        to: new Date(endDate.getTime() - 1).toISOString(),
      },
      summary: {
        totalHotels: hotels.length,
        totalBookings: grandTotalBookings,
        totalBookingAmount: grandTotalBookingAmount.toNumber(),
        totalCommission: grandTotalCommission.toNumber(),
        averageCommissionRate: grandTotalBookingAmount.isZero()
          ? 0
          : grandTotalCommission.div(grandTotalBookingAmount).toNumber(),
      },
      hotels,
    };
  }

  async getMonthlyRecords(month: string) {
    const { startDate, endDate } = this.getMonthDateRange(month);

    const records = await this.prisma.commissionRecord.findMany({
      where: {
        calculatedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        booking: {
          include: { hotel: true },
        },
        agreement: true,
      },
      orderBy: { calculatedAt: 'asc' },
    });

    return records.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      bookingReference: r.booking.bookingReference,
      hotelId: r.booking.hotelId,
      hotelName: r.booking.hotel?.name ?? 'Unknown',
      hotelStatus: r.booking.hotel?.status ?? 'STANDARD',
      bookingAmount: r.bookingAmount.toNumber(),
      currency: r.currency,
      rateType: r.agreement.rateType,
      baseRate: r.baseRate.toNumber(),
      preferredBonus: r.preferredBonus.toNumber(),
      tierBonus: r.tierBonus.toNumber(),
      totalRate: r.totalRate.toNumber(),
      commissionAmount: r.commissionAmount.toNumber(),
      calculatedAt: r.calculatedAt.toISOString(),
    }));
  }

  recordsToCsv(
    records: Awaited<ReturnType<typeof this.getMonthlyRecords>>,
  ): string {
    if (records.length === 0) {
      return '';
    }

    const headers = Object.keys(records[0]);
    const csvLines = [headers.join(',')];

    for (const record of records) {
      const values = headers.map((h) => {
        const val = (record as Record<string, unknown>)[h];
        if (
          typeof val === 'string' &&
          (val.includes(',') || val.includes('"'))
        ) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      });
      csvLines.push(values.join(','));
    }

    return csvLines.join('\n');
  }
}
