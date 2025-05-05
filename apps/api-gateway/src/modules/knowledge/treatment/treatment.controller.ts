import { Roles } from '@common/decorator/roles.decorator';
import { CreateTreatmentDto } from '@common/dto/knowledge/create-treatment.dto';
import { UpdateTreatmentDto } from '@common/dto/knowledge/update-treatment.dto';
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
import { TreatmentService } from './treatment.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@ApiTags('治疗方式管理')
@Controller('treatment')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建治疗方式',
    description: '创建新的治疗方式（仅管理员和专家可访问）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createTreatmentDto: CreateTreatmentDto) {
    return this.treatmentService.create(createTreatmentDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取所有治疗方式',
    description: '获取所有治疗方式列表',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll() {
    return this.treatmentService.findAll();
  }

  @Get('list')
  @ApiOperation({
    summary: '分页获取治疗方式列表',
    description: '分页获取治疗方式列表',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.treatmentService.findList(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取单个治疗方式',
    description: '获取指定治疗方式的详细信息',
  })
  @ApiParam({ name: 'id', description: '治疗方式ID', type: 'number' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '治疗方式不存在' })
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.treatmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '更新治疗方式',
    description: '更新指定治疗方式的信息',
  })
  @ApiParam({ name: 'id', description: '治疗方式ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '治疗方式不存在' })
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
  ) {
    return this.treatmentService.update(id, updateTreatmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除治疗方式', description: '删除指定的治疗方式' })
  @ApiParam({ name: 'id', description: '治疗方式ID', type: 'number' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '治疗方式不存在' })
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.treatmentService.remove(id);
  }
}
