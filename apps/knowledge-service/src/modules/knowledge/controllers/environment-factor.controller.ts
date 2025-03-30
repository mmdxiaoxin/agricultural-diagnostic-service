import { EnvironmentFactorDto } from '@common/dto/knowledge/environment-factor.dto';
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
    @Payload() payload: { dto: EnvironmentFactorDto },
  ) {
    return this.environmentFactorService.create(payload.dto);
  }
}
