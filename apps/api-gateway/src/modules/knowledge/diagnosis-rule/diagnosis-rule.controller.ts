import { Roles } from '@common/decorator/roles.decorator';
import { CreateDiagnosisRuleDto } from '@common/dto/knowledge/create-diagnosisRule.dto';
import { UpdateDiagnosisRuleDto } from '@common/dto/knowledge/update-diagnosisRule.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { DiagnosisRuleService } from './diagnosis-rule.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@ApiTags('诊断规则管理')
@Controller('diagnosis-rule')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class DiagnosisRuleController {
  constructor(private readonly diagnosisRuleService: DiagnosisRuleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDiagnosisRuleDto: CreateDiagnosisRuleDto) {
    return this.diagnosisRuleService.create(createDiagnosisRuleDto);
  }

  @Get()
  findAll() {
    return this.diagnosisRuleService.findAll();
  }

  @Get('list')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.diagnosisRuleService.findList(query);
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diagnosisRuleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateDiagnosisRuleDto: UpdateDiagnosisRuleDto,
  ) {
    return this.diagnosisRuleService.update(id, updateDiagnosisRuleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diagnosisRuleService.remove(id);
  }
}
