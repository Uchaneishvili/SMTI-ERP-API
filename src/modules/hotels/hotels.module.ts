import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { CommissionAgreementsModule } from '../commission-agreements/commission-agreements.module';

@Module({
  imports: [CommissionAgreementsModule],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
