import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeServiceController } from './knowledge-service.controller';
import { KnowledgeServiceService } from './knowledge-service.service';

describe('KnowledgeServiceController', () => {
  let knowledgeServiceController: KnowledgeServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeServiceController],
      providers: [KnowledgeServiceService],
    }).compile();

    knowledgeServiceController = app.get<KnowledgeServiceController>(KnowledgeServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(knowledgeServiceController.getHello()).toBe('Hello World!');
    });
  });
});
