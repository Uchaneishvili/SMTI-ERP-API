import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommissionAgreementsService } from './commission-agreements.service';
import {
  CreateCommissionAgreementDto,
  UpdateCommissionAgreementDto,
  CommissionAgreementResponseDto,
} from './dto';
import { PaginationQueryDto } from '../hotels/dto/pagination.dto'; // Reuse reusable DTO
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { CommissionAgreement } from '@prisma/client';

@ApiTags('Commission Agreements')
@ApiBearerAuth()
@Controller('commission-agreements')
@Serialize(CommissionAgreementResponseDto)
export class CommissionAgreementsController {
  constructor(private readonly service: CommissionAgreementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new commission agreement' })
  @ApiResponse({ status: 201, type: CommissionAgreementResponseDto })
  create(
    @Body() dto: CreateCommissionAgreementDto,
  ): Promise<CommissionAgreement> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List commission agreements' })
  @ApiResponse({ status: 200, type: [CommissionAgreementResponseDto] })
  findAll(@Query() query: PaginationQueryDto): Promise<CommissionAgreement[]> {
    const { page = 1, limit = 10 } = query;
    return this.service.findAll({
      pagination: { page, limit },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agreement by ID' })
  @ApiParam({ name: 'id', description: 'Agreement UUID' })
  @ApiResponse({ status: 200, type: CommissionAgreementResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommissionAgreement> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agreement' })
  @ApiParam({ name: 'id', description: 'Agreement UUID' })
  @ApiResponse({ status: 200, type: CommissionAgreementResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionAgreementDto,
  ): Promise<CommissionAgreement> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete agreement' })
  @ApiParam({ name: 'id', description: 'Agreement UUID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id) as Promise<any>;
  }
}
