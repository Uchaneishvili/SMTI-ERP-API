import { Module } from '@nestjs/common';
import { CommissionAgreementsService } from './commission-agreements.service';
import { CommissionAgreementsController } from './commission-agreements.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CommissionAgreementsController],
  providers: [CommissionAgreementsService, PrismaService],
  exports: [CommissionAgreementsService],
})
export class CommissionAgreementsModule {}
