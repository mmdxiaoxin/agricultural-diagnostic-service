import { NestFactory } from '@nestjs/core';
import { DownloadServiceModule } from './download-service.module';

async function bootstrap() {
  const app = await NestFactory.create(DownloadServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
