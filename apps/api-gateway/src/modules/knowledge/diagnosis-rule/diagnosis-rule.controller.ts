import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DiagnosisRuleService } from './diagnosis-rule.service';
import { CreateDiagnosisRuleDto } from './dto/create-diagnosis-rule.dto';
import { UpdateDiagnosisRuleDto } from './dto/update-diagnosis-rule.dto';

@Controller('diagnosis-rule')
export class DiagnosisRuleController {
  constructor(private readonly diagnosisRuleService: DiagnosisRuleService) {}

  @Post()
  create(@Body() createDiagnosisRuleDto: CreateDiagnosisRuleDto) {
    return this.diagnosisRuleService.create(createDiagnosisRuleDto);
  }

  @Get()
  findAll() {
    return this.diagnosisRuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.diagnosisRuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDiagnosisRuleDto: UpdateDiagnosisRuleDto) {
    return this.diagnosisRuleService.update(+id, updateDiagnosisRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.diagnosisRuleService.remove(+id);
  }
}
