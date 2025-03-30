import { Module } from '@nestjs/common';
import { DiagnosisRuleService } from './diagnosis-rule.service';
import { DiagnosisRuleController } from './diagnosis-rule.controller';

@Module({
  controllers: [DiagnosisRuleController],
  providers: [DiagnosisRuleService],
})
export class DiagnosisRuleModule {}
