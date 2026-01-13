import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponseDto,
  PaginationQueryDto,
} from './dto';
import { Booking } from '@prisma/client';
import { Serialize } from '../../common/interceptors/serialize.interceptor';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@Serialize(BookingResponseDto)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or hotel not found',
  })
  @ApiResponse({ status: 409, description: 'Booking reference already exists' })
  create(@Body() createBookingDto: CreateBookingDto): Promise<Booking> {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({
    status: 200,
    description: 'List of all bookings',
    type: [BookingResponseDto],
  })
  findAll(@Query() query: PaginationQueryDto): Promise<Booking[]> {
    const { page = 1, limit = 10, search } = query;

    return this.bookingsService.findAll({
      pagination: { page, limit },
      search: search
        ? { query: search, fields: ['bookingReference'] }
        : undefined,
      include: { hotel: true },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: 200,
    description: 'Booking found',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.findOne(id, { include: { hotel: true } });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking (including status transition)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a booking as completed' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: 200,
    description: 'Booking marked as completed',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  complete(@Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.complete(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({ status: 204, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.bookingsService.remove(id);
  }
}
