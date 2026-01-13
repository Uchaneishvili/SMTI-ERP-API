import { Injectable, BadRequestException } from '@nestjs/common';
import { Booking, BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseService } from '../../common/services/base.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService extends BaseService<
  Booking,
  CreateBookingDto,
  UpdateBookingDto
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.booking, 'Booking');
  }

  private transformToCreateInput(
    dto: CreateBookingDto,
  ): Omit<CreateBookingDto, 'bookingDate'> & { bookingDate: Date } {
    return {
      ...dto,
      bookingDate: new Date(dto.bookingDate),
    };
  }

  async create(data: CreateBookingDto): Promise<Booking> {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: data.hotelId },
    });

    if (!hotel) {
      throw new BadRequestException(
        `Hotel with ID "${data.hotelId}" does not exist`,
      );
    }

    const prismaData = this.transformToCreateInput(data);
    return super.create(prismaData as unknown as CreateBookingDto);
  }

  async update(id: string, data: UpdateBookingDto): Promise<Booking> {
    const booking = await this.findOne(id);

    if (data.status) {
      this.validateStatusTransition(booking.status, data.status);

      if (data.status === BookingStatus.COMPLETED && !data.completedAt) {
        data = { ...data, completedAt: new Date().toISOString() };
      }
    }

    return super.update(id, data);
  }

  async complete(id: string): Promise<Booking> {
    return this.update(id, { status: BookingStatus.COMPLETED });
  }

  async cancel(id: string): Promise<Booking> {
    return this.update(id, { status: BookingStatus.CANCELLED });
  }

  private validateStatusTransition(
    current: BookingStatus,
    next: BookingStatus,
  ): void {
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Cannot transition booking from ${current} to ${next}`,
      );
    }
  }
}
