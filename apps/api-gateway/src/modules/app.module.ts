import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DatasetModule } from './dataset/dataset.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { FileModule } from './file/file.module';
import { CropModule } from './knowledge/crop/crop.module';
import { DiagnosisRuleModule } from './knowledge/diagnosis-rule/diagnosis-rule.module';
import { DiseaseModule } from './knowledge/disease/disease.module';
import { EnvironmentFactorModule } from './knowledge/environment-factor/environment-factor.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { SymptomModule } from './knowledge/symptom/symptom.module';
import { TreatmentModule } from './knowledge/treatment/treatment.module';
import { MenuModule } from './menu/menu.module';
import { RemoteModule } from './remote/remote.module';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';

/**
 * 根模块
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: FILE_SERVICE_TCP_PORT },
      },
    ]),
    PrometheusModule.register(),
    AuthModule,
    UserModule,
    RoleModule,
    FileModule,
    DatasetModule,
    MenuModule,
    KnowledgeModule,
    RouterModule.register([
      {
        path: 'knowledge',
        module: CropModule,
      },
      {
        path: 'knowledge',
        module: DiseaseModule,
      },
      {
        path: 'knowledge',
        module: EnvironmentFactorModule,
      },
      {
        path: 'knowledge',
        module: SymptomModule,
      },
      {
        path: 'knowledge',
        module: DiagnosisRuleModule,
      },
      {
        path: 'knowledge',
        module: TreatmentModule,
      },
    ]),
    DiagnosisModule,
    RemoteModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
