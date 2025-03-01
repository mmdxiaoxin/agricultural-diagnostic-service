import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { DatasetService } from './dataset.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';

@Controller('dataset')
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  // 获取数据集列表
  @Get('list')
  async getDatasetsList() {
    return this.datasetService.getDatasetsList();
  }

  // 创建数据集
  @Post('create')
  async createDataset(@Body() createDatasetDto: CreateDatasetDto) {
    return this.datasetService.createDataset(createDatasetDto);
  }

  // 获取数据集详情
  @Get(':datasetId')
  async getDatasetDetail(@Param('datasetId') datasetId: number) {
    return this.datasetService.getDatasetDetail(datasetId);
  }

  // 更新数据集
  @Put(':datasetId')
  async updateDataset(
    @Param('datasetId') datasetId: number,
    @Body() updateDatasetDto: UpdateDatasetDto,
  ) {
    return this.datasetService.updateDataset(datasetId, updateDatasetDto);
  }

  // 删除数据集
  @Delete(':datasetId')
  async deleteDataset(@Param('datasetId') datasetId: number) {
    return this.datasetService.deleteDataset(datasetId);
  }
}
