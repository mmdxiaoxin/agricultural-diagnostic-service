import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        `.env.${process.env.NODE_ENV || 'development'}.local`,
      ],
    }),
    DatabaseModule.register(),
    KnowledgeModule,
    PrometheusModule.register(),
  ],
})
export class AppModule {}
