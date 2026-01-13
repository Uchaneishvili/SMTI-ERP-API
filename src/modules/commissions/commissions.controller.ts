import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CalculateCommissionDto } from './dto/calculate-commission.dto';

@ApiTags('Commissions')
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
}
