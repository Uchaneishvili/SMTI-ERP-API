import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { ExportFormat } from './dto/calculate-commission.dto';
import { HotelStatus, CommissionRateType } from '@prisma/client';

describe('CommissionsController', () => {
  let controller: CommissionsController;
  let service: jest.Mocked<CommissionsService>;

  const mockCommissionRecord = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    bookingId: '223e4567-e89b-12d3-a456-426614174001',
    agreementId: '323e4567-e89b-12d3-a456-426614174002',
    bookingAmount: 1500.0,
    currency: 'CHF',
    baseRate: 0.1,
    preferredBonus: 0.02,
    tierBonus: 0.01,
    totalRate: 0.13,
    commissionAmount: 195.0,
    calculatedAt: new Date(),
  };

  const mockSummary = {
    month: '2026-03',
    period: { from: '2026-03-01', to: '2026-03-31' },
    summary: {
      totalHotels: 2,
      totalBookings: 10,
      totalBookingAmount: 15000,
      totalCommission: 1950,
      averageCommissionRate: 0.13,
    },
    hotels: [],
  };

  const mockRecords = [
    {
      id: '1',
      bookingId: '2',
      bookingReference: 'BK-001',
      hotelId: '3',
      hotelName: 'Test Hotel',
      hotelStatus: HotelStatus.STANDARD,
      bookingAmount: 1500,
      currency: 'CHF',
      rateType: CommissionRateType.PERCENTAGE,
      baseRate: 0.1,
      preferredBonus: 0,
      tierBonus: 0,
      totalRate: 0.1,
      commissionAmount: 150,
      calculatedAt: '2026-03-15T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    const mockService = {
      calculateCommission: jest.fn(),
      getMonthlySummary: jest.fn(),
      getMonthlyRecords: jest.fn(),
      recordsToCsv: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionsController],
      providers: [{ provide: CommissionsService, useValue: mockService }],
    }).compile();

    controller = module.get<CommissionsController>(CommissionsController);
    service = module.get(CommissionsService);
  });

  describe('calculateCommission', () => {
    it('should calculate commission for a booking', async () => {
      service.calculateCommission.mockResolvedValue(
        mockCommissionRecord as any,
      );

      const result = await controller.calculateCommission({
        bookingId: mockCommissionRecord.bookingId,
      });

      expect(result).toEqual(mockCommissionRecord);
      expect(service.calculateCommission).toHaveBeenCalledWith(
        mockCommissionRecord.bookingId,
      );
    });
  });

  describe('getMonthlySummary', () => {
    it('should return monthly summary', async () => {
      service.getMonthlySummary.mockResolvedValue(mockSummary);

      const result = await controller.getMonthlySummary({ month: '2026-03' });

      expect(result).toEqual(mockSummary);
      expect(service.getMonthlySummary).toHaveBeenCalledWith('2026-03');
    });
  });

  describe('exportMonthlyRecords', () => {
    it('should export records as JSON by default', async () => {
      service.getMonthlyRecords.mockResolvedValue(mockRecords);

      const mockResponse = {
        setHeader: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportMonthlyRecords({ month: '2026-03' }, mockResponse);

      expect(service.getMonthlyRecords).toHaveBeenCalledWith('2026-03');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should export records as CSV when format=csv', async () => {
      service.getMonthlyRecords.mockResolvedValue(mockRecords);
      service.recordsToCsv.mockReturnValue('id,bookingId\n1,2');

      const mockResponse = {
        setHeader: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportMonthlyRecords(
        { month: '2026-03', format: ExportFormat.CSV },
        mockResponse,
      );

      expect(service.recordsToCsv).toHaveBeenCalledWith(mockRecords);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.send).toHaveBeenCalledWith('id,bookingId\n1,2');
    });
  });
});
