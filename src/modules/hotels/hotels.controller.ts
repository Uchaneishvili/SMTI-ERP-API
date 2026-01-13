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
import { HotelsService } from './hotels.service';
import {
  CreateHotelDto,
  UpdateHotelDto,
  HotelResponseDto,
  PaginationQueryDto,
} from './dto';
import { Hotel, CommissionAgreement } from '@prisma/client';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { CommissionAgreementsService } from '../commission-agreements/commission-agreements.service';
import { CommissionAgreementResponseDto } from '../commission-agreements/dto/commission-agreement-response.dto';

@ApiTags('Hotels')
@ApiBearerAuth()
@Controller('hotels')
export class HotelsController {
  constructor(
    private readonly hotelsService: HotelsService,
    private readonly agreementsService: CommissionAgreementsService,
  ) {}

  @Post()
  @Serialize(HotelResponseDto)
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
  @Serialize(HotelResponseDto)
  @ApiOperation({ summary: 'Get all hotels' })
  @ApiResponse({
    status: 200,
    description: 'List of all hotels',
    type: [HotelResponseDto],
  })
  findAll(@Query() query: PaginationQueryDto): Promise<Hotel[]> {
    const { page = 1, limit = 10, search } = query;

    return this.hotelsService.findAll({
      pagination: { page, limit },
      search: search ? { query: search, fields: ['name'] } : undefined,
    });
  }

  @Get(':id')
  @Serialize(HotelResponseDto)
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

  @Get(':id/commission-agreement')
  @Serialize(CommissionAgreementResponseDto)
  @ApiOperation({ summary: 'Get the active commission agreement for a hotel' })
  @ApiParam({ name: 'id', description: 'Hotel UUID' })
  @ApiResponse({
    status: 200,
    description: 'Active commission agreement',
    type: CommissionAgreementResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Hotel or agreement not found' })
  async getActiveAgreement(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommissionAgreement | null> {
    // Validate hotel exists first
    await this.hotelsService.findOne(id);
    return this.agreementsService.findActiveAgreement(id);
  }

  @Patch(':id')
  @Serialize(HotelResponseDto)
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
