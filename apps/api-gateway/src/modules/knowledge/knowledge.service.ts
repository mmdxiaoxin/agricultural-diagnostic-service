import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { MatchKnowledgeDto } from '@common/dto/knowledge/match-knowledge.dto';
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

  findAll() {
    return this.client.send({ cmd: 'knowledge.get' }, {});
  }

  findList(query: PageQueryKnowledgeDto) {
    return this.client.send({ cmd: 'knowledge.get.list' }, { query });
  }
   
  match(query: MatchKnowledgeDto) {
    return this.client.send({ cmd: 'knowledge.match' }, { query });
  }

  create(dto: CreateKnowledgeDto) {
    return this.client.send({ cmd: 'knowledge.create' }, { dto });
  }

  update(id: number, dto: UpdateKnowledgeDto) {
    return this.client.send({ cmd: 'knowledge.update' }, { id, dto });
  }

  remove(id: number) {
    return this.client.send({ cmd: 'knowledge.delete' }, { id });
  }
}
