import { Roles } from '@common/decorator/roles.decorator';
import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { TypeormFilter } from '@common/filters/typeorm.filter';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ParseStringDatePipe } from '@common/pipe/string-date.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { FILE_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@ApiTags('数据集管理模块')
@Controller('dataset')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(TypeormFilter)
export class DatasetController {
  constructor(
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
  ) {}

  // 获取数据集列表
  @Get('list')
  async datasetsListGet(
    @Req() req: Request,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
    @Query('name') name?: string,
    @Query('createdStart', ParseStringDatePipe) createdStart?: string,
    @Query('createdEnd', ParseStringDatePipe) createdEnd?: string,
    @Query('updatedStart', ParseStringDatePipe) updatedStart?: string,
    @Query('updatedEnd', ParseStringDatePipe) updatedEnd?: string,
  ) {
    const response = await lastValueFrom(
      this.fileClient.send(
        { cmd: 'dataset.get.list' },
        {
          page,
          pageSize,
          name,
          createdStart,
          createdEnd,
          updatedStart,
          updatedEnd,
          userId: req.user.userId,
        },
      ),
    );
    return formatResponse(200, response?.result, '获取数据集列表成功');
  }

  // 创建数据集
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createDataset(@Req() req: Request, @Body() dto: CreateDatasetDto) {
    const response = await lastValueFrom(
      this.fileClient.send(
        {
          cmd: 'dataset.create',
        },
        {
          userId: req.user.userId,
          dto,
        },
      ),
    );
    return formatResponse(201, response?.result, '创建数据集成功');
  }

  // 获取数据集详情
  @Get(':datasetId')
  async getDatasetDetail(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
  ) {
    const response = await lastValueFrom(
      this.fileClient.send(
        {
          cmd: 'dataset.detail',
        },
        {
          datasetId,
        },
      ),
    );
    return formatResponse(200, response?.result, '获取数据集详情成功');
  }

  // 更新数据集
  @Put(':datasetId')
  async updateDataset(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
    @Req() req: Request,
    @Body() dto: UpdateDatasetDto,
  ) {
    const response = await lastValueFrom(
      this.fileClient.send(
        {
          cmd: 'dataset.update',
        },
        {
          datasetId,
          userId: req.user.userId,
          dto,
        },
      ),
    );
    return formatResponse(200, response?.result, '更新数据集成功');
  }

  // 删除数据集
  @Delete(':datasetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDataset(
    @Param(
      'datasetId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    datasetId: number,
    @Req() req: Request,
  ) {
    await firstValueFrom(
      this.fileClient.send(
        {
          cmd: 'dataset.delete',
        },
        {
          datasetId,
          userId: req.user.userId,
        },
      ),
    );
    return formatResponse(204, null, '删除数据集成功');
  }
}
