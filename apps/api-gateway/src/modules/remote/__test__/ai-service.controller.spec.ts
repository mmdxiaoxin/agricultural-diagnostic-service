import { Test, TestingModule } from '@nestjs/testing';
import { RemoteController } from '../remote.controller';
import { RemoteService } from '../remote.service';

describe('AiServiceController', () => {
  let controller: RemoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemoteController],
      providers: [RemoteService],
    }).compile();

    controller = module.get<RemoteController>(RemoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
