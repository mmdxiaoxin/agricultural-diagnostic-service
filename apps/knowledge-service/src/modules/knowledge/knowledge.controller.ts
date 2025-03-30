import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KnowledgeService } from './knowledge.service';

@Controller()
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // 创建病害知识记录
  @MessagePattern({ cmd: 'knowledge.create' })
  async knowledgeCreate(@Payload() payload: { dto: CreateKnowledgeDto }) {
    return this.knowledgeService.knowledgeCreate(payload.dto);
  }

  // 获取所有病害知识记录
  @MessagePattern({ cmd: 'knowledge.get' })
  async knowledgeGet() {
    return this.knowledgeService.knowledgeGet();
  }

  // 获取单个病害知识记录
  @MessagePattern({ cmd: 'knowledge.get.byId' })
  async knowledgeGetById(@Payload() payload: { id: number }) {
    return this.knowledgeService.knowledgeGetById(payload.id);
  }

  // 更新病害知识记录
  @MessagePattern({ cmd: 'knowledge.update' })
  async knowledgeUpdate(
    @Payload() payload: { id: number; dto: UpdateKnowledgeDto },
  ) {
    return this.knowledgeService.knowledgeUpdate(payload.id, payload.dto);
  }

  // 删除病害知识记录
  @MessagePattern({ cmd: 'knowledge.delete' })
  async knowledgeDelete(@Payload() payload: { id: number }) {
    return this.knowledgeService.knowledgeRemove(payload.id);
  }
}
