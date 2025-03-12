import { NestFactory } from '@nestjs/core';
import { UploadServiceModule } from './upload-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UploadServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
