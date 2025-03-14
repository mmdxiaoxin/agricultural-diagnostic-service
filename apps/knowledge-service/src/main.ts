import { NestFactory } from '@nestjs/core';
import { KnowledgeServiceModule } from './knowledge-service.module';

async function bootstrap() {
  const app = await NestFactory.create(KnowledgeServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
