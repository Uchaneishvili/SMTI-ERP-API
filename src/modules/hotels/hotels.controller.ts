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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HotelsService } from './hotels.service';
import { CreateHotelDto, UpdateHotelDto, HotelResponseDto } from './dto';
import { Hotel } from '@prisma/client';
import { Serialize } from '../../common/interceptors/serialize.interceptor';

@ApiTags('Hotels')
@ApiBearerAuth()
@Controller('hotels')
@Serialize(HotelResponseDto)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hotel' })
  @ApiResponse({
    status: 201,
    description: 'Hotel created successfully',
    type: HotelResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Hotel already exists' })
  create(@Body() createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.hotelsService.create(createHotelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hotels' })
  @ApiResponse({
    status: 200,
    description: 'List of all hotels',
    type: [HotelResponseDto],
  })
  findAll(): Promise<Hotel[]> {
    return this.hotelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hotel by ID' })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiResponse({
    status: 200,
    description: 'Hotel found',
    type: HotelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Hotel> {
    return this.hotelsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a hotel' })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiResponse({
    status: 200,
    description: 'Hotel updated successfully',
    type: HotelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  @ApiResponse({ status: 409, description: 'Hotel name conflict' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ): Promise<Hotel> {
    return this.hotelsService.update(id, updateHotelDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a hotel' })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiResponse({ status: 204, description: 'Hotel deleted successfully' })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.hotelsService.remove(id);
  }
}
