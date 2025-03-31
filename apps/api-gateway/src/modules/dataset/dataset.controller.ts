import { Roles } from '@common/decorator/roles.decorator';
import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
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
  async datasetsListGet(@Req() req: Request, @Query() query: DatasetQueryDto) {
    return this.datasetService.getDatasetList(query, req.user.userId);
  }

  @Get('public/list')
  async publicDatasetsListGet(@Query() query: DatasetQueryDto) {
    return this.datasetService.getPublicDatasetList(query);
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
