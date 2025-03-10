import { Roles } from '@common/decorator/roles.decorator';
import { Role } from '@shared/enum/role.enum';
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
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { DatasetManageService } from './service/dataset-manage.service';

@Controller('dataset')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(TypeormFilter)
export class DatasetController {
  constructor(private readonly manageService: DatasetManageService) {}

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
    return this.manageService.datasetsListGet(page, pageSize, req.user.userId, {
      name,
      createdStart,
      createdEnd,
      updatedStart,
      updatedEnd,
    });
  }

  // 创建数据集
  @Post('create')
  async createDataset(@Req() req: Request, @Body() dto: CreateDatasetDto) {
    return this.manageService.createDataset(req.user.userId, dto);
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
    return this.manageService.getDatasetDetail(datasetId);
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
    return this.manageService.updateDataset(datasetId, req.user.userId, dto);
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
    return this.manageService.deleteDataset(datasetId, req.user.userId);
  }
}
