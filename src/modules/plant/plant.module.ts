import { Module } from '@nestjs/common';
import { PlantService } from './plant.service';
import { PlantController } from './plant.controller';

@Module({
  controllers: [PlantController],
  providers: [PlantService],
})
export class PlantModule {}
