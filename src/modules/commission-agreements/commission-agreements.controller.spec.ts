import { Test, TestingModule } from '@nestjs/testing';
import { CommissionAgreementsController } from './commission-agreements.controller';
import { CommissionAgreementsService } from './commission-agreements.service';
import { CommissionRateType } from '@prisma/client';

describe('CommissionAgreementsController', () => {
  let controller: CommissionAgreementsController;
  let service: jest.Mocked<CommissionAgreementsService>;

  const mockAgreement = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    hotelId: '223e4567-e89b-12d3-a456-426614174001',
    rateType: CommissionRateType.PERCENTAGE,
    baseRate: 0.1,
    preferredBonusRate: 0.02,
    effectiveFrom: new Date(),
    effectiveUntil: null,
    isActive: true,
    createdAt: new Date(),
    tierRules: [],
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionAgreementsController],
      providers: [
        { provide: CommissionAgreementsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<CommissionAgreementsController>(
      CommissionAgreementsController,
    );
    service = module.get(CommissionAgreementsService);
  });

  describe('create', () => {
    it('should create a commission agreement', async () => {
      service.create.mockResolvedValue(mockAgreement as any);

      const result = await controller.create({
        hotelId: mockAgreement.hotelId,
        rateType: CommissionRateType.PERCENTAGE,
        baseRate: 0.1,
        preferredBonusRate: 0.02,
      });

      expect(result).toEqual(mockAgreement);
      expect(service.create).toHaveBeenCalled();
    });

    it('should create agreement with tier rules', async () => {
      const agreementWithTiers = {
        ...mockAgreement,
        rateType: CommissionRateType.TIERED,
        tierRules: [{ minBookings: 5, maxBookings: 10, bonusRate: 0.01 }],
      };
      service.create.mockResolvedValue(agreementWithTiers as any);

      const result = await controller.create({
        hotelId: mockAgreement.hotelId,
        rateType: CommissionRateType.TIERED,
        baseRate: 0.1,
        tierRules: [{ minBookings: 5, maxBookings: 10, bonusRate: 0.01 }],
      });

      expect((result as any).tierRules).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return array of agreements', async () => {
      service.findAll.mockResolvedValue([mockAgreement] as any);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual([mockAgreement]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an agreement by id', async () => {
      service.findOne.mockResolvedValue(mockAgreement as any);

      const result = await controller.findOne(mockAgreement.id);

      expect(result).toEqual(mockAgreement);
      expect(service.findOne).toHaveBeenCalledWith(mockAgreement.id);
    });
  });

  describe('update', () => {
    it('should update an agreement', async () => {
      const updatedAgreement = { ...mockAgreement, baseRate: 0.15 };
      service.update.mockResolvedValue(updatedAgreement as any);

      const result = await controller.update(mockAgreement.id, {
        baseRate: 0.15,
      });

      expect(result.baseRate).toBe(0.15);
      expect(service.update).toHaveBeenCalledWith(mockAgreement.id, {
        baseRate: 0.15,
      });
    });
  });

  describe('remove', () => {
    it('should delete an agreement', async () => {
      service.remove.mockResolvedValue(mockAgreement as any);

      await controller.remove(mockAgreement.id);

      expect(service.remove).toHaveBeenCalledWith(mockAgreement.id);
    });
  });
});
