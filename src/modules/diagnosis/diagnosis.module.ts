import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisHistory } from './models/diagnosis-history.entity';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [FileModule, TypeOrmModule.forFeature([DiagnosisHistory])],
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
