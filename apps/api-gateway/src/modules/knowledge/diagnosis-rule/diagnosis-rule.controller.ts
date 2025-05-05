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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { DiagnosisRuleService } from './diagnosis-rule.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@ApiTags('诊断规则管理')
@Controller('diagnosis-rule')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class DiagnosisRuleController {
  constructor(private readonly diagnosisRuleService: DiagnosisRuleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建诊断规则',
    description: '创建新的诊断规则（仅管理员和专家可访问）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createDiagnosisRuleDto: CreateDiagnosisRuleDto) {
    return this.diagnosisRuleService.create(createDiagnosisRuleDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取所有诊断规则',
    description: '获取所有诊断规则列表',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll() {
    return this.diagnosisRuleService.findAll();
  }

  @Get('list')
  @ApiOperation({
    summary: '分页获取诊断规则列表',
    description: '分页获取诊断规则列表',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.diagnosisRuleService.findList(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取单个诊断规则',
    description: '获取指定诊断规则的详细信息',
  })
  @ApiParam({ name: 'id', description: '诊断规则ID', type: 'number' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '诊断规则不存在' })
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
  @ApiOperation({
    summary: '更新诊断规则',
    description: '更新指定诊断规则的信息',
  })
  @ApiParam({ name: 'id', description: '诊断规则ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '诊断规则不存在' })
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
  @ApiOperation({ summary: '删除诊断规则', description: '删除指定的诊断规则' })
  @ApiParam({ name: 'id', description: '诊断规则ID', type: 'number' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '诊断规则不存在' })
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
