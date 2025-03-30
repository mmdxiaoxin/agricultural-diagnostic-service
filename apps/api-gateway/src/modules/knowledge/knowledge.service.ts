import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
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
    return this.client.send('findAll', {});
  }

  async findList() {
    return this.client.send('findList', {});
  }

  create(createKnowledgeDto: CreateKnowledgeDto) {
    throw new Error('Method not implemented.');
  }

  update(id: string, updateKnowledgeDto: UpdateKnowledgeDto) {
    throw new Error('Method not implemented.');
  }

  remove(id: string) {
    throw new Error('Method not implemented.');
  }
}
