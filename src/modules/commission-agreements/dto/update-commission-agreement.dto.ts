import { PartialType } from '@nestjs/swagger';
import { CreateCommissionAgreementDto } from './create-commission-agreement.dto';

export class UpdateCommissionAgreementDto extends PartialType(
  CreateCommissionAgreementDto,
) {}
