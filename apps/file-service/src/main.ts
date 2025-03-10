import { NestFactory } from '@nestjs/core';
import { FileServiceModule } from './file-service.module';

async function bootstrap() {
  const app = await NestFactory.create(FileServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
