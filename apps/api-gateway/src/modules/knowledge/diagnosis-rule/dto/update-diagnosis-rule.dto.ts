import { PartialType } from '@nestjs/mapped-types';
import { CreateDiagnosisRuleDto } from './create-diagnosis-rule.dto';

export class UpdateDiagnosisRuleDto extends PartialType(CreateDiagnosisRuleDto) {}
