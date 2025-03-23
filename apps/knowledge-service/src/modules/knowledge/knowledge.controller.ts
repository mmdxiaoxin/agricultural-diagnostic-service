import { CreatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KnowledgeService } from './knowledge.service';

@Controller()
export class KnowledgeController {
  constructor(private readonly KnowledgeService: KnowledgeService) {}

  // 创建病害知识记录
  @MessagePattern({ cmd: 'knowledge.create' })
  async knowledgeCreate(
    @Payload() payload: { dto: CreatePlantDiseaseKnowledgeDto },
  ) {
    return this.KnowledgeService.knowledgeCreate(payload.dto);
  }

  // 获取所有病害知识记录
  @MessagePattern({ cmd: 'knowledge.get' })
  async knowledgeGet() {
    return this.KnowledgeService.knowledgeGet();
  }

  // 获取所有病害知识记录分页
  @MessagePattern({ cmd: 'knowledge.get.list' })
  async knowledgeListGet(
    @Payload() payload: { page: number; pageSize: number; category?: string },
  ) {
    return this.KnowledgeService.knowledgeListGet(
      payload.page,
      payload.pageSize,
      { category: payload.category },
    );
  }

  // 获取单个病害知识记录
  @MessagePattern({ cmd: 'knowledge.get.byId' })
  async knowledgeDetailGet(@Payload() payload: { id: number }) {
    return this.KnowledgeService.knowledgeGetById(payload.id);
  }

  // 更新病害知识记录
  @MessagePattern({ cmd: 'knowledge.update' })
  async knowledgeUpdate(
    @Payload() payload: { id: number; dto: UpdatePlantDiseaseKnowledgeDto },
  ) {
    return this.KnowledgeService.knowledgeUpdate(payload.id, payload.dto);
  }

  // 删除病害知识记录
  @MessagePattern({ cmd: 'knowledge.delete' })
  async knowledgeDelete(@Payload() payload: { id: number }) {
    return this.KnowledgeService.knowledgeRemove(payload.id);
  }
}
