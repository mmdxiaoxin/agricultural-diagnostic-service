import { CropDto } from '@common/dto/knowledge/crop.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CropService } from '../services/crop.service';

@Controller()
export class CropController {
  constructor(private readonly cropService: CropService) {}

  // 作物相关接口
  @MessagePattern({ cmd: 'crop.create' })
  async createCrop(@Payload() payload: { dto: CropDto }) {
    return this.cropService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'crop.findAll' })
  async findAllCrops() {
    return this.cropService.findAll();
  }

  @MessagePattern({ cmd: 'crop.findById' })
  async findCropById(@Payload() payload: { id: number }) {
    return this.cropService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'crop.update' })
  async updateCrop(@Payload() payload: { id: number; dto: CropDto }) {
    return this.cropService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'crop.delete' })
  async removeCrop(@Payload() payload: { id: number }) {
    return this.cropService.remove(payload.id);
  }
}
