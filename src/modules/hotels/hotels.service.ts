import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Hotel, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHotelDto, UpdateHotelDto } from './dto';

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    try {
      return await this.prisma.hotel.create({
        data: createHotelDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Hotel with name "${createHotelDto.name}" already exists`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<Hotel[]> {
    return this.prisma.hotel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID "${id}" not found`);
    }

    return hotel;
  }

  async update(id: string, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    await this.findOne(id); // Throws if not found

    try {
      return await this.prisma.hotel.update({
        where: { id },
        data: updateHotelDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Hotel with name "${updateHotelDto.name}" already exists`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Hotel> {
    await this.findOne(id); // Throws if not found

    return this.prisma.hotel.delete({
      where: { id },
    });
  }
}
