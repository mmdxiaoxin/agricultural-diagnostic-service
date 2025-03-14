import { Controller, Get } from '@nestjs/common';
import { KnowledgeServiceService } from './knowledge-service.service';

@Controller()
export class KnowledgeServiceController {
  constructor(private readonly knowledgeServiceService: KnowledgeServiceService) {}

  @Get()
  getHello(): string {
    return this.knowledgeServiceService.getHello();
  }
}
