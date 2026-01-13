import { Test, TestingModule } from '@nestjs/testing';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { CommissionAgreementsService } from '../commission-agreements/commission-agreements.service';
import { HotelStatus } from '@prisma/client';

describe('HotelsController', () => {
  let controller: HotelsController;
  let hotelsService: jest.Mocked<HotelsService>;
  let agreementsService: jest.Mocked<CommissionAgreementsService>;

  const mockHotel = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Grand Hotel Zurich',
    status: HotelStatus.PREFERRED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAgreement = {
    id: '223e4567-e89b-12d3-a456-426614174001',
    hotelId: mockHotel.id,
    rateType: 'PERCENTAGE',
    baseRate: 0.1,
    preferredBonusRate: 0.02,
    effectiveFrom: new Date(),
    effectiveUntil: null,
    isActive: true,
    createdAt: new Date(),
    tierRules: [],
  };

  beforeEach(async () => {
    const mockHotelsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockAgreementsService = {
      findActiveAgreement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        { provide: HotelsService, useValue: mockHotelsService },
        {
          provide: CommissionAgreementsService,
          useValue: mockAgreementsService,
        },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
    hotelsService = module.get(HotelsService);
    agreementsService = module.get(CommissionAgreementsService);
  });

  describe('create', () => {
    it('should create a hotel', async () => {
      hotelsService.create.mockResolvedValue(mockHotel);

      const result = await controller.create({
        name: 'Grand Hotel Zurich',
        status: HotelStatus.PREFERRED,
      });

      expect(result).toEqual(mockHotel);
      expect(hotelsService.create).toHaveBeenCalledWith({
        name: 'Grand Hotel Zurich',
        status: HotelStatus.PREFERRED,
      });
    });
  });

  describe('findAll', () => {
    it('should return array of hotels', async () => {
      hotelsService.findAll.mockResolvedValue([mockHotel]);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual([mockHotel]);
      expect(hotelsService.findAll).toHaveBeenCalled();
    });

    it('should pass search parameter', async () => {
      hotelsService.findAll.mockResolvedValue([mockHotel]);

      await controller.findAll({ page: 1, limit: 10, search: 'Grand' });

      expect(hotelsService.findAll).toHaveBeenCalledWith({
        pagination: { page: 1, limit: 10 },
        search: { query: 'Grand', fields: ['name'] },
      });
    });
  });

  describe('findOne', () => {
    it('should return a hotel by id', async () => {
      hotelsService.findOne.mockResolvedValue(mockHotel);

      const result = await controller.findOne(mockHotel.id);

      expect(result).toEqual(mockHotel);
      expect(hotelsService.findOne).toHaveBeenCalledWith(mockHotel.id);
    });
  });

  describe('getActiveAgreement', () => {
    it('should return active commission agreement for hotel', async () => {
      hotelsService.findOne.mockResolvedValue(mockHotel);
      agreementsService.findActiveAgreement.mockResolvedValue(
        mockAgreement as any,
      );

      const result = await controller.getActiveAgreement(mockHotel.id);

      expect(result).toEqual(mockAgreement);
      expect(hotelsService.findOne).toHaveBeenCalledWith(mockHotel.id);
      expect(agreementsService.findActiveAgreement).toHaveBeenCalledWith(
        mockHotel.id,
      );
    });

    it('should return null if no active agreement', async () => {
      hotelsService.findOne.mockResolvedValue(mockHotel);
      agreementsService.findActiveAgreement.mockResolvedValue(null);

      const result = await controller.getActiveAgreement(mockHotel.id);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a hotel', async () => {
      const updatedHotel = { ...mockHotel, name: 'Updated Hotel' };
      hotelsService.update.mockResolvedValue(updatedHotel);

      const result = await controller.update(mockHotel.id, {
        name: 'Updated Hotel',
      });

      expect(result).toEqual(updatedHotel);
      expect(hotelsService.update).toHaveBeenCalledWith(mockHotel.id, {
        name: 'Updated Hotel',
      });
    });
  });

  describe('remove', () => {
    it('should delete a hotel', async () => {
      hotelsService.remove.mockResolvedValue(mockHotel);

      await controller.remove(mockHotel.id);

      expect(hotelsService.remove).toHaveBeenCalledWith(mockHotel.id);
    });
  });
});
