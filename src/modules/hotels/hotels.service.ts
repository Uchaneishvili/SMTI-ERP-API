import { Injectable } from '@nestjs/common';
import { Hotel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseService } from '../../common/services/base.service';

@Injectable()
export class HotelsService extends BaseService<Hotel> {
  constructor(prisma: PrismaService) {
    super(prisma.hotel, 'Hotel');
  }
}
