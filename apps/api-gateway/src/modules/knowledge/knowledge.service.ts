import { CreatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  // 创建病害知识记录
  knowledgeCreate(dto: CreatePlantDiseaseKnowledgeDto) {
    return this.client.send({ cmd: 'knowledge.create' }, { dto });
  }

  // 获取所有病害知识记录
  knowledgeListGet(
    page: number = 1,
    pageSize: number = 10,
    filters: {
      category?: string;
    },
  ) {
    return this.client.send(
      { cmd: 'knowledge.get.list' },
      { page, pageSize, ...filters },
    );
  }

  knowledgeGet() {
    return this.client.send({ cmd: 'knowledge.get' }, {});
  }

  // 获取单个病害知识记录
  knowledgeGetById(id: number) {
    return this.client.send({ cmd: 'knowledge.get.byId' }, { id });
  }

  // 更新病害知识记录
  knowledgeUpdate(id: number, dto: UpdatePlantDiseaseKnowledgeDto) {
    return this.client.send({ cmd: 'knowledge.update' }, { id, dto });
  }

  // 删除病害知识记录
  knowledgeRemove(id: number) {
    return this.client.send({ cmd: 'knowledge.delete' }, { id });
  }
}
