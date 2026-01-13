import { Module } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommissionAgreementsModule } from '../commission-agreements/commission-agreements.module';
import { CommissionsController } from './commissions.controller';

@Module({
  imports: [PrismaModule, CommissionAgreementsModule],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
