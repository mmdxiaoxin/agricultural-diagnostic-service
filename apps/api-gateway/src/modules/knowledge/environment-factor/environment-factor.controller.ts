import { Roles } from '@common/decorator/roles.decorator';
import {
  ApiErrorResponse,
  ApiResponse,
  ApiNullResponse,
} from '@common/decorator/api-response.decorator';
import { CreateEnvironmentFactorDto } from '@common/dto/knowledge/create-environmentFactor.dto';
import { UpdateEnvironmentFactorDto } from '@common/dto/knowledge/update-environmentFactor.dto';
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
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { EnvironmentFactorService } from './environment-factor.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@ApiTags('环境因素管理')
@Controller('environment-factor')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnvironmentFactorController {
  constructor(
    private readonly environmentFactorService: EnvironmentFactorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建环境因素',
    description: '创建新的环境因素信息（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.CREATED, '创建成功', CreateEnvironmentFactorDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  create(@Body() createEnvironmentFactorDto: CreateEnvironmentFactorDto) {
    return this.environmentFactorService.create(createEnvironmentFactorDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取所有环境因素',
    description: '获取所有环境因素列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  findAll() {
    return this.environmentFactorService.findAll();
  }

  @Get('list')
  @ApiOperation({
    summary: '分页获取环境因素列表',
    description: '分页获取环境因素列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.environmentFactorService.findList(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取单个环境因素',
    description: '获取指定环境因素的详细信息',
  })
  @ApiParam({ name: 'id', description: '环境因素ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '环境因素不存在')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.environmentFactorService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '更新环境因素',
    description: '更新指定环境因素的信息',
  })
  @ApiParam({ name: 'id', description: '环境因素ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateEnvironmentFactorDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '环境因素不存在')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateEnvironmentFactorDto: UpdateEnvironmentFactorDto,
  ) {
    return this.environmentFactorService.update(id, updateEnvironmentFactorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除环境因素', description: '删除指定的环境因素' })
  @ApiParam({ name: 'id', description: '环境因素ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '环境因素不存在')
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.environmentFactorService.remove(id);
  }
}
