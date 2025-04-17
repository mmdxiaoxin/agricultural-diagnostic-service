import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { PageQueryKnowledgeDto } from '@common/dto/knowledge/page-query-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KnowledgeService } from '../services/knowledge.service';

@Controller()
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // 作物相关接口
  @MessagePattern({ cmd: 'knowledge.create' })
  async createKnowledge(@Payload() payload: { dto: CreateKnowledgeDto }) {
    return this.knowledgeService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'knowledge.get' })
  async findAllKnowledges() {
    return this.knowledgeService.findAll();
  }

  @MessagePattern({ cmd: 'knowledge.get.list' })
  async findList(@Payload() payload: { query: PageQueryKnowledgeDto }) {
    return this.knowledgeService.findList(payload.query);
  }

  @MessagePattern({ cmd: 'knowledge.get.byId' })
  async findKnowledgeById(@Payload() payload: { id: number }) {
    return this.knowledgeService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'knowledge.update' })
  async updateKnowledge(
    @Payload() payload: { id: number; dto: UpdateKnowledgeDto },
  ) {
    return this.knowledgeService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'knowledge.delete' })
  async removeKnowledge(@Payload() payload: { id: number }) {
    return this.knowledgeService.remove(payload.id);
  }

  @MessagePattern({ cmd: 'knowledge.match' })
  async matchKnowledge(@Payload() payload: { query: string | Record<string, any> }) {
    return this.knowledgeService.match(payload.query);
  }
}
