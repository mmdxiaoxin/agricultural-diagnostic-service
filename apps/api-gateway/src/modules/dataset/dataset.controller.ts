import { Roles } from '@common/decorator/roles.decorator';
import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { Request } from 'express';
import { DatasetService } from './dataset.service';

@ApiTags('数据集管理模块')
@Controller('dataset')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

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
    return this.datasetService.getDatasetList({
      page,
      pageSize,
      name,
      createdStart,
      createdEnd,
      updatedStart,
      updatedEnd,
      userId: req.user.userId,
    });
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createDataset(@Req() req: Request, @Body() dto: CreateDatasetDto) {
    return this.datasetService.createDataset(req.user.userId, dto);
  }

  @Get(':datasetId')
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
    return this.datasetService.deleteDataset(datasetId, req.user.userId);
  }
}
