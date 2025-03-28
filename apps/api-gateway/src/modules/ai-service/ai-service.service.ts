import { CreateAiConfigDto } from '@common/dto/ai-service/create-remote-config.dto';
import { CreateAiConfigsDto } from '@common/dto/ai-service/create-remote-configs.dto';
import { CreateAiServiceDto } from '@common/dto/ai-service/create-remote-service.dto';
import { UpdateAiConfigsDto } from '@common/dto/ai-service/update-remote-configs.dto';
import { UpdateAiServiceDto } from '@common/dto/ai-service/update-remote-service.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DIAGNOSIS_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class AiServiceService {
  constructor(
    @Inject(DIAGNOSIS_SERVICE_NAME)
    private readonly diagnosisClient: ClientProxy,
  ) {}

  createAi(dto: CreateAiServiceDto) {
    return this.diagnosisClient.send({ cmd: 'service.create' }, dto);
  }

  getAi() {
    return this.diagnosisClient.send({ cmd: 'service.get' }, {});
  }

  getAiList(page: number, pageSize: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.get.list' },
      { page, pageSize },
    );
  }

  getAiById(id: number) {
    return this.diagnosisClient.send({ cmd: 'service.get.byId' }, id);
  }

  updateAi(serviceId: number, dto: UpdateAiServiceDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.update' },
      { serviceId, dto },
    );
  }

  removeAi(id: number) {
    return this.diagnosisClient.send({ cmd: 'service.remove' }, id);
  }

  copyAi(id: number) {
    return this.diagnosisClient.send({ cmd: 'service.copy' }, id);
  }

  addAiConfig(configId: number, dto: CreateAiConfigDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.create' },
      { configId, dto },
    );
  }

  addAiConfigs(configId: number, dto: CreateAiConfigsDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.configs.create' },
      { configId, dto },
    );
  }

  getAiConfigs(configId: number) {
    return this.diagnosisClient.send({ cmd: 'service.configs.get' }, configId);
  }

  updateAiConfig(configId: number, dto: CreateAiConfigDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.update' },
      { configId, dto },
    );
  }

  updateAiConfigs(serviceId: number, dto: UpdateAiConfigsDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.configs.update' },
      { serviceId, dto },
    );
  }

  removeAiConfig(serviceId: number, configId: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.remove' },
      { serviceId, configId },
    );
  }
}
