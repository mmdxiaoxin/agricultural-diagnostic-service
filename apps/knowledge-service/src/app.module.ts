import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    KnowledgeModule,
    PrometheusModule.register(),
  ],
})
export class AppModule {}
