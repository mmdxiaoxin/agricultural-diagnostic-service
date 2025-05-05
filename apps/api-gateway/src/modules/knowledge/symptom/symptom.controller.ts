import { Roles } from '@common/decorator/roles.decorator';
import { CreateSymptomDto } from '@common/dto/knowledge/create-symptom.dto';
import { UpdateSymptomDto } from '@common/dto/knowledge/update-symptom.dto';
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
  Res,
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
import { SymptomService } from './symptom.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { Response } from 'express';

@ApiTags('症状管理')
@Controller('symptom')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class SymptomController {
  constructor(private readonly symptomService: SymptomService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建症状',
    description: '创建新的症状信息（仅管理员和专家可访问）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createSymptomDto: CreateSymptomDto) {
    return this.symptomService.create(createSymptomDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有症状', description: '获取所有症状列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll() {
    return this.symptomService.findAll();
  }

  @Get('list')
  @ApiOperation({
    summary: '分页获取症状列表',
    description: '分页获取症状列表',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.symptomService.findList(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取单个症状',
    description: '获取指定症状的详细信息',
  })
  @ApiParam({ name: 'id', description: '症状ID', type: 'number' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '症状不存在' })
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.symptomService.findOne(id);
  }

  @Get(':id/image')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '获取症状图片',
    description: '获取指定症状的图片（所有角色可访问）',
  })
  @ApiParam({ name: 'id', description: '症状ID', type: 'number' })
  @ApiResponse({ status: 200, description: '获取成功', type: 'image/*' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '症状图片不存在' })
  findImage(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Res() res: Response,
  ) {
    return this.symptomService.findImage(id, res);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新症状', description: '更新指定症状的信息' })
  @ApiParam({ name: 'id', description: '症状ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '症状不存在' })
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateSymptomDto: UpdateSymptomDto,
  ) {
    return this.symptomService.update(id, updateSymptomDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除症状', description: '删除指定的症状' })
  @ApiParam({ name: 'id', description: '症状ID', type: 'number' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '症状不存在' })
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.symptomService.remove(id);
  }
}
