import { Test, TestingModule } from '@nestjs/testing';
import { AiServiceController } from './ai-service.controller';

describe('AiServiceController', () => {
  let controller: AiServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiServiceController],
    }).compile();

    controller = module.get<AiServiceController>(AiServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
