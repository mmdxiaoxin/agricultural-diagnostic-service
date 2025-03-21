import { Test, TestingModule } from '@nestjs/testing';
import { AiServiceController } from '../ai-service.controller';
import { AiServiceService } from '../ai-service.service';

describe('AiServiceController', () => {
  let controller: AiServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiServiceController],
      providers: [AiServiceService],
    }).compile();

    controller = module.get<AiServiceController>(AiServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
