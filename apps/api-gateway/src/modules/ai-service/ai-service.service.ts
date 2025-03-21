import { CreateAiConfigDto } from '@common/dto/ai-service/create-ai-config.dto';
import { CreateAiConfigsDto } from '@common/dto/ai-service/create-ai-configs.dto';
import { CreateAiServiceDto } from '@common/dto/ai-service/create-ai-service.dto';
import { UpdateAiServiceDto } from '@common/dto/ai-service/update-ai-service.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DIAGNOSIS_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class AiServiceService {
  constructor(
    @Inject(DIAGNOSIS_SERVICE_NAME)
    private readonly diagnosisClient: ClientProxy,
  ) {}
  async createAi(dto: CreateAiServiceDto) {
    return this.diagnosisClient.send({ cmd: 'ai-service.create' }, dto);
  }

  async getAi() {
    return this.diagnosisClient.send({ cmd: 'ai-service.get' }, {});
  }

  async getAiList(page: number, pageSize: number) {
    return this.diagnosisClient.send(
      { cmd: 'ai-service.get.list' },
      { page, pageSize },
    );
  }

  async getAiById(id: number) {
    return this.diagnosisClient.send({ cmd: 'ai-service.get.byId' }, id);
  }

  async updateAi(serviceId: number, dto: UpdateAiServiceDto) {
    return this.diagnosisClient.send(
      { cmd: 'ai-service.update' },
      { serviceId, dto },
    );
  }

  async removeAi(id: number) {
    return this.diagnosisClient.send({ cmd: 'ai-service.remove' }, id);
  }

  async addAiConfig(configId: number, dto: CreateAiConfigDto) {
    return this.diagnosisClient.send(
      { cmd: 'ai-service.config.create' },
      { configId, dto },
    );
  }

  async addAiConfigs(configId: number, dto: CreateAiConfigsDto) {
    return this.diagnosisClient.send(
      { cmd: 'ai-service.configs.create' },
      { configId, dto },
    );
  }

  async getAiConfigs(configId: number) {
    return this.diagnosisClient.send(
      { cmd: 'ai-service.configs.get' },
      configId,
    );
  }

  async updateAiConfig(configId: number, dto: CreateAiConfigDto) {
    return this.diagnosisClient.send(
      { cmd: 'ai-service.config.update' },
      { configId, dto },
    );
  }

  async removeAiConfig(configId: number) {
    return this.diagnosisClient.send(
      { cmd: 'ai-service.config.remove' },
      configId,
    );
  }
}
