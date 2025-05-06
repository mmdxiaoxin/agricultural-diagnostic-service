import {
  ApiErrorResponse,
  ApiNullResponse,
  ApiResponse,
} from '@common/decorator/api-response.decorator';
import { Roles } from '@common/decorator/roles.decorator';
import { CreateDiagnosisRuleDto } from '@common/dto/knowledge/create-diagnosisRule.dto';
import { DiagnosisRuleDto } from '@common/dto/knowledge/diagnosis-rule.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateDiagnosisRuleDto } from '@common/dto/knowledge/update-diagnosisRule.dto';
import { createPageResponseDto } from '@common/dto/page-response.dto';
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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { DiagnosisRuleService } from './diagnosis-rule.service';

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
  @ApiResponse(HttpStatus.CREATED, '创建成功', DiagnosisRuleDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  create(@Body() createDiagnosisRuleDto: CreateDiagnosisRuleDto) {
    return this.diagnosisRuleService.create(createDiagnosisRuleDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取所有诊断规则',
    description: '获取所有诊断规则列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', DiagnosisRuleDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  findAll() {
    return this.diagnosisRuleService.findAll();
  }

  @Get('list')
  @ApiOperation({
    summary: '分页获取诊断规则列表',
    description: '分页获取诊断规则列表',
  })
  @ApiResponse(
    HttpStatus.OK,
    '获取成功',
    createPageResponseDto(DiagnosisRuleDto),
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.diagnosisRuleService.findList(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取单个诊断规则',
    description: '获取指定诊断规则的详细信息',
  })
  @ApiParam({ name: 'id', description: '诊断规则ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', DiagnosisRuleDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断规则不存在')
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
  @ApiResponse(HttpStatus.OK, '更新成功', DiagnosisRuleDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断规则不存在')
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
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断规则不存在')
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
