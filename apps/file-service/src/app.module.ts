import { DatabaseModule } from '@app/database';
import { Dataset, File } from '@app/database/entities';
import { FileOperationModule } from '@app/file-operation';
import { MetricsModule } from '@app/metrics';
import { Module } from '@nestjs/common';
import { FileController } from './app.controller';
import { FileService } from './app.service';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([File, Dataset]),
    MetricsModule,
    FileOperationModule,
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class AppModule {}
