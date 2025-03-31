import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { PageQueryKnowledgeDto } from '@common/dto/knowledge/page-query-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  async findAll() {
    return this.client.send('knowledge.get', {});
  }

  async findList(query: PageQueryKnowledgeDto) {
    return this.client.send('knowledge.get.list', { query });
  }

  create(createKnowledgeDto: CreateKnowledgeDto) {
    return this.client.send('knowledge.create', { createKnowledgeDto });
  }

  update(id: number, updateKnowledgeDto: UpdateKnowledgeDto) {
    return this.client.send('knowledge.update', { id, updateKnowledgeDto });
  }

  remove(id: number) {
    return this.client.send('knowledge.delete', { id });
  }
}
