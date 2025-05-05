import { Roles } from '@common/decorator/roles.decorator';
import {
  ApiErrorResponse,
  ApiResponse,
  ApiNullResponse,
} from '@common/decorator/api-response.decorator';
import { CreateCropDto } from '@common/dto/knowledge/create-crop.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateCropDto } from '@common/dto/knowledge/update-crop.dto';
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
import { CropService } from './crop.service';

@ApiTags('作物管理')
@Controller('crop')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class CropController {
  constructor(private readonly cropService: CropService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建作物',
    description: '创建新的作物信息（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.CREATED, '创建成功', CreateCropDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  create(@Body() createCropDto: CreateCropDto) {
    return this.cropService.create(createCropDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '获取所有作物',
    description: '获取所有作物列表（所有角色可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  findAll() {
    return this.cropService.findAll();
  }

  @Get('list')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '分页获取作物列表',
    description: '分页获取作物列表（所有角色可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  findList(@Query() query: PageQueryKeywordsDto) {
    return this.cropService.findList(query);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @ApiOperation({
    summary: '获取单个作物',
    description: '获取指定作物的详细信息（所有角色可访问）',
  })
  @ApiParam({ name: 'id', description: '作物ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '作物不存在')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.cropService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '更新作物',
    description: '更新指定作物的信息（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'id', description: '作物ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateCropDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '作物不存在')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateCropDto: UpdateCropDto,
  ) {
    return this.cropService.update(id, updateCropDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除作物',
    description: '删除指定的作物（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'id', description: '作物ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '作物不存在')
  remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.cropService.remove(id);
  }
}
