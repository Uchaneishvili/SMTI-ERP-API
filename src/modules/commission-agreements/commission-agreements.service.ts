import { Injectable, BadRequestException } from '@nestjs/common';
import { CommissionAgreement, CommissionRateType } from '@prisma/client';
import { BaseService, QueryParams } from '../../common/services/base.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommissionAgreementDto } from './dto';

@Injectable()
export class CommissionAgreementsService extends BaseService<CommissionAgreement> {
  constructor(prisma: PrismaService) {
    super(prisma.commissionAgreement, 'CommissionAgreement');
  }

  async create(
    data: CreateCommissionAgreementDto,
  ): Promise<CommissionAgreement> {
    const { tierRules, ...agreementData } = data;

    if (
      agreementData.rateType === CommissionRateType.TIERED &&
      (!tierRules || tierRules.length === 0)
    ) {
      throw new BadRequestException(
        'Tiered rate type requires at least one tier rule.',
      );
    }

    const createData = {
      ...agreementData,
      tierRules: tierRules?.length ? { create: tierRules } : undefined,
    };

    return super.create(createData, { include: { tierRules: true } });
  }

  async findAll(params?: QueryParams): Promise<CommissionAgreement[]> {
    const { include, ...otherParams } = params || {};
    return super.findAll({
      ...otherParams,
      include: {
        tierRules: true,
        ...include,
      },
    });
  }

  async findOne(id: string): Promise<CommissionAgreement> {
    return super.findOne(id, { include: { tierRules: true } });
  }

  async findActiveAgreement(
    hotelId: string,
  ): Promise<CommissionAgreement | null> {
    const now = new Date();
    return (this.model as any).findFirst({
      where: {
        hotelId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: { gte: now } }, { effectiveUntil: null }],
      },
      orderBy: { createdAt: 'desc' },
      include: { tierRules: true },
    });
  }
}
