import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@shared/enum/role.enum';
import { DiagnosisRuleService } from './diagnosis-rule.service';
import { CreateDiagnosisRuleDto } from './dto/create-diagnosis-rule.dto';
import { UpdateDiagnosisRuleDto } from './dto/update-diagnosis-rule.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('诊断规则管理')
@Controller('diagnosis-rule')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
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
  update(
    @Param('id') id: string,
    @Body() updateDiagnosisRuleDto: UpdateDiagnosisRuleDto,
  ) {
    return this.diagnosisRuleService.update(+id, updateDiagnosisRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.diagnosisRuleService.remove(+id);
  }
}
