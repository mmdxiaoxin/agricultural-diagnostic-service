import { CreateCropDto } from '@common/dto/knowledge/create-crop.dto';
import { PageKeywordsDto } from '@common/dto/knowledge/page-keywords.dto';
import { UpdateCropDto } from '@common/dto/knowledge/update-crop.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CropService } from '../services/crop.service';

@Controller()
export class CropController {
  constructor(private readonly cropService: CropService) {}

  // 作物相关接口
  @MessagePattern({ cmd: 'crop.create' })
  async createCrop(@Payload() payload: { dto: CreateCropDto }) {
    return this.cropService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'crop.get' })
  async findAllCrops() {
    return this.cropService.findAll();
  }

  @MessagePattern({ cmd: 'crop.get.list' })
  async findList(@Payload() payload: { query: PageKeywordsDto }) {
    return this.cropService.findList(payload.query);
  }

  @MessagePattern({ cmd: 'crop.get.byId' })
  async findCropById(@Payload() payload: { id: number }) {
    return this.cropService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'crop.update' })
  async updateCrop(@Payload() payload: { id: number; dto: UpdateCropDto }) {
    return this.cropService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'crop.delete' })
  async removeCrop(@Payload() payload: { id: number }) {
    return this.cropService.remove(payload.id);
  }
}
