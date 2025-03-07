import { Test, TestingModule } from '@nestjs/testing';
import { PlantController } from '../plant.controller';
import { PlantService } from '../plant.service';

describe('PlantController', () => {
  let controller: PlantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantController],
      providers: [PlantService],
    }).compile();

    controller = module.get<PlantController>(PlantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
