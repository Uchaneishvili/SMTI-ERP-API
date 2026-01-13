import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CommissionsService } from './commissions.service';
import {
  CalculateCommissionDto,
  MonthQueryDto,
  ExportQueryDto,
  ExportFormat,
} from './dto/calculate-commission.dto';

@ApiTags('Commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate commission for a specific booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The calculated commission record',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking or Agreement not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Booking not completed',
  })
  async calculateCommission(@Body() dto: CalculateCommissionDto) {
    return this.commissionsService.calculateCommission(dto.bookingId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get monthly commission summary' })
  @ApiQuery({
    name: 'month',
    description: 'Month in YYYY-MM format',
    example: '2026-03',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly commission summary with hotel breakdown',
  })
  async getMonthlySummary(@Query() query: MonthQueryDto) {
    return this.commissionsService.getMonthlySummary(query.month);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export monthly commission records (JSON or CSV)' })
  @ApiQuery({
    name: 'month',
    description: 'Month in YYYY-MM format',
    example: '2026-03',
  })
  @ApiQuery({
    name: 'format',
    description: 'Export format',
    enum: ExportFormat,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission records in requested format',
  })
  async exportMonthlyRecords(
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const records = await this.commissionsService.getMonthlyRecords(
      query.month,
    );
    const format = query.format ?? ExportFormat.JSON;

    if (format === ExportFormat.CSV) {
      const csv = this.commissionsService.recordsToCsv(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=commissions-${query.month}.csv`,
      );
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=commissions-${query.month}.json`,
    );
    return res.json({
      month: query.month,
      recordCount: records.length,
      records,
    });
  }
}
