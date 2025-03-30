import { Module } from '@nestjs/common';
import { CropService } from './crop.service';
import { CropController } from './crop.controller';

@Module({
  controllers: [CropController],
  providers: [CropService],
})
export class CropModule {}
