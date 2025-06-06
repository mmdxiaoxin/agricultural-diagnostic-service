import { CreateEnvironmentFactorDto } from '@common/dto/knowledge/create-environmentFactor.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateEnvironmentFactorDto } from '@common/dto/knowledge/update-environmentFactor.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EnvironmentFactorService } from '../services/environment-factor.service';

@Controller()
export class EnvironmentFactorController {
  constructor(
    private readonly environmentFactorService: EnvironmentFactorService,
  ) {}

  // 环境因素相关接口
  @MessagePattern({ cmd: 'environmentFactor.create' })
  async createEnvironmentFactor(
    @Payload() payload: { dto: CreateEnvironmentFactorDto },
  ) {
    return this.environmentFactorService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'environmentFactor.get' })
  async findAllEnvironmentFactors() {
    return this.environmentFactorService.findAll();
  }

  @MessagePattern({ cmd: 'environmentFactor.get.list' })
  async findList(@Payload() payload: { query: PageQueryKeywordsDto }) {
    return this.environmentFactorService.findList(payload.query);
  }

  @MessagePattern({ cmd: 'environmentFactor.get.byId' })
  async findEnvironmentFactorById(@Payload() payload: { id: number }) {
    return this.environmentFactorService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'environmentFactor.update' })
  async updateEnvironmentFactor(
    @Payload() payload: { id: number; dto: UpdateEnvironmentFactorDto },
  ) {
    return this.environmentFactorService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'environmentFactor.delete' })
  async removeEnvironmentFactor(@Payload() payload: { id: number }) {
    return this.environmentFactorService.remove(payload.id);
  }
}
