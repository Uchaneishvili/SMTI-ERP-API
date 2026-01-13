import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingStatus } from '@prisma/client';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: jest.Mocked<BookingsService>;

  const mockBooking = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    hotelId: '223e4567-e89b-12d3-a456-426614174001',
    bookingReference: 'BK-2026-001',
    amount: 1500.0,
    currency: 'CHF',
    status: BookingStatus.PENDING,
    bookingDate: new Date('2026-01-15'),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockBookingsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      complete: jest.fn(),
      cancel: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: mockBookingsService }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = module.get(BookingsService);
  });

  describe('create', () => {
    it('should create a booking', async () => {
      bookingsService.create.mockResolvedValue(mockBooking as any);

      const result = await controller.create({
        hotelId: mockBooking.hotelId,
        bookingReference: 'BK-2026-001',
        amount: 1500.0,
        bookingDate: '2026-01-15T10:00:00Z',
      });

      expect(result).toEqual(mockBooking);
      expect(bookingsService.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return array of bookings', async () => {
      bookingsService.findAll.mockResolvedValue([mockBooking] as any);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual([mockBooking]);
      expect(bookingsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      bookingsService.findOne.mockResolvedValue(mockBooking as any);

      const result = await controller.findOne(mockBooking.id);

      expect(result).toEqual(mockBooking);
      expect(bookingsService.findOne).toHaveBeenCalledWith(mockBooking.id, {
        include: { hotel: true },
      });
    });
  });

  describe('update', () => {
    it('should update a booking', async () => {
      const updatedBooking = {
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      };
      bookingsService.update.mockResolvedValue(updatedBooking as any);

      const result = await controller.update(mockBooking.id, {
        status: BookingStatus.COMPLETED,
      });

      expect(result).toEqual(updatedBooking);
      expect(bookingsService.update).toHaveBeenCalledWith(mockBooking.id, {
        status: BookingStatus.COMPLETED,
      });
    });
  });

  describe('complete', () => {
    it('should mark booking as completed', async () => {
      const completedBooking = {
        ...mockBooking,
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      };
      bookingsService.complete.mockResolvedValue(completedBooking as any);

      const result = await controller.complete(mockBooking.id);

      expect(result).toEqual(completedBooking);
      expect(bookingsService.complete).toHaveBeenCalledWith(mockBooking.id);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };
      bookingsService.cancel.mockResolvedValue(cancelledBooking as any);

      const result = await controller.cancel(mockBooking.id);

      expect(result).toEqual(cancelledBooking);
      expect(bookingsService.cancel).toHaveBeenCalledWith(mockBooking.id);
    });
  });

  describe('remove', () => {
    it('should delete a booking', async () => {
      bookingsService.remove.mockResolvedValue(mockBooking as any);

      await controller.remove(mockBooking.id);

      expect(bookingsService.remove).toHaveBeenCalledWith(mockBooking.id);
    });
  });
});
