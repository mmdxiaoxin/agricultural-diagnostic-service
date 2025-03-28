import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { RemoteServiceModule } from './modules/remote/remote.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';

@Module({
  imports: [DiagnosisModule, RemoteServiceModule, DatabaseModule.register()],
})
export class AppModule {}
