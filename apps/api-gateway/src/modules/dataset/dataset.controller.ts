import { Roles } from '@common/decorator/roles.decorator';
import {
  ApiErrorResponse,
  ApiResponse,
  ApiNullResponse,
} from '@common/decorator/api-response.decorator';
import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetAccessDto } from '@common/dto/dataset/update-dataset-access.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { DatasetQueryDto } from '@common/dto/diagnosis/dastaset-query.dto';
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
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { Request, Response } from 'express';
import { DatasetService } from './dataset.service';

@ApiTags('数据集管理模块')
@Controller('dataset')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  @Get('list')
  @ApiOperation({
    summary: '获取数据集列表',
    description: '获取当前用户的数据集列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', DatasetQueryDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async datasetsListGet(@Req() req: Request, @Query() query: DatasetQueryDto) {
    return this.datasetService.getDatasetList(query, req.user.userId);
  }

  @Get('public/list')
  @ApiOperation({
    summary: '获取公共数据集列表',
    description: '获取所有公开的数据集列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', DatasetQueryDto)
  async publicDatasetsListGet(@Query() query: DatasetQueryDto) {
    return this.datasetService.getPublicDatasetList(query);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建数据集', description: '创建新的数据集' })
  @ApiResponse(HttpStatus.CREATED, '创建成功', CreateDatasetDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async createDataset(@Req() req: Request, @Body() dto: CreateDatasetDto) {
    return this.datasetService.createDataset(req.user.userId, dto);
  }

  @Post(':datasetId/copy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '复制数据集', description: '复制指定的数据集' })
  @ApiParam({ name: 'datasetId', description: '数据集ID', type: 'number' })
  @ApiResponse(HttpStatus.CREATED, '复制成功', CreateDatasetDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '数据集不存在')
  async copyDataset(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
    @Req() req: Request,
  ) {
    return this.datasetService.copyDataset(datasetId, req.user.userId);
  }

  @Get(':datasetId')
  @ApiOperation({
    summary: '获取数据集详情',
    description: '获取指定数据集的详细信息',
  })
  @ApiParam({ name: 'datasetId', description: '数据集ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', CreateDatasetDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '数据集不存在')
  async getDatasetDetail(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
  ) {
    return this.datasetService.getDatasetDetail(datasetId);
  }

  @Put(':datasetId')
  @ApiOperation({ summary: '更新数据集', description: '更新指定数据集的信息' })
  @ApiParam({ name: 'datasetId', description: '数据集ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateDatasetDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '数据集不存在')
  async updateDataset(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
    @Req() req: Request,
    @Body() dto: UpdateDatasetDto,
  ) {
    return this.datasetService.updateDataset(datasetId, req.user.userId, dto);
  }

  @Put(':datasetId/access')
  @ApiOperation({
    summary: '更新数据集访问权限',
    description: '更新指定数据集的访问权限设置',
  })
  @ApiParam({ name: 'datasetId', description: '数据集ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateDatasetAccessDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '数据集不存在')
  async updateDatasetAccess(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
    @Req() req: Request,
    @Body() dto: UpdateDatasetAccessDto,
  ) {
    return this.datasetService.updateDatasetAccess(
      datasetId,
      req.user.userId,
      dto,
    );
  }

  @Delete(':datasetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除数据集', description: '删除指定的数据集' })
  @ApiParam({ name: 'datasetId', description: '数据集ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '数据集不存在')
  async deleteDataset(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
    @Req() req: Request,
  ) {
    return this.datasetService.deleteDataset(datasetId, req.user.userId);
  }

  @Get(':datasetId/download')
  @ApiOperation({ summary: '下载数据集', description: '下载指定数据集的内容' })
  @ApiParam({ name: 'datasetId', description: '数据集ID', type: 'number' })
  @ApiNullResponse(HttpStatus.OK, '下载成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '数据集不存在')
  async downloadDataset(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
    @Res() res: Response,
  ) {
    return this.datasetService.downloadDataset(datasetId, res);
  }
}
