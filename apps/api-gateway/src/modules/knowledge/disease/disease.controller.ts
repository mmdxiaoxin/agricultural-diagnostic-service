import { Roles } from '@common/decorator/roles.decorator';
import { CreateDiseaseDto } from '@common/dto/knowledge/create-disease.dto';
import { UpdateDiseaseDto } from '@common/dto/knowledge/update-disease.dto';
import { PageQueryDateDto } from '@common/dto/page-query-date.dto';
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
import { DiseaseService } from './disease.service';

@ApiTags('疾病管理')
@Controller('disease')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Post()
  @Roles(Role.Admin, Role.Expert)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建疾病',
    description: '创建新的疾病信息（仅管理员和专家可访问）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createDiseaseDto: CreateDiseaseDto) {
    return this.diseaseService.create(createDiseaseDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '获取所有疾病',
    description: '获取所有疾病列表（所有角色可访问）',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll() {
    return this.diseaseService.findAll();
  }

  @Get('list')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '分页获取疾病列表',
    description: '分页获取疾病列表（所有角色可访问）',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findList(@Query() query: PageQueryDateDto) {
    return this.diseaseService.findList(query);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '获取单个疾病',
    description: '获取指定疾病的详细信息（所有角色可访问）',
  })
  @ApiParam({ name: 'id', description: '疾病ID', type: 'number' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '疾病不存在' })
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diseaseService.findOne(id);
  }

  @Get(':id/symptoms')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '获取疾病症状',
    description: '获取指定疾病的所有症状（所有角色可访问）',
  })
  @ApiParam({ name: 'id', description: '疾病ID', type: 'number' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '疾病不存在' })
  findSymptoms(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diseaseService.findSymptoms(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Expert)
  @ApiOperation({
    summary: '更新疾病',
    description: '更新指定疾病的信息（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'id', description: '疾病ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '疾病不存在' })
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateDiseaseDto: UpdateDiseaseDto,
  ) {
    return this.diseaseService.update(id, updateDiseaseDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Expert)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除疾病',
    description: '删除指定的疾病（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'id', description: '疾病ID', type: 'number' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '疾病不存在' })
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diseaseService.remove(id);
  }
}
