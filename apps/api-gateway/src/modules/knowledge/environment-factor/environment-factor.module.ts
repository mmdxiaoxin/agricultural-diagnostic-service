import { Module } from '@nestjs/common';
import { EnvironmentFactorService } from './environment-factor.service';
import { EnvironmentFactorController } from './environment-factor.controller';

@Module({
  controllers: [EnvironmentFactorController],
  providers: [EnvironmentFactorService],
})
export class EnvironmentFactorModule {}
