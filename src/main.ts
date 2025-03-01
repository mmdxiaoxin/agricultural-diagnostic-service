import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 只允许DTO中定义的字段
      forbidNonWhitelisted: true, // 禁止DTO未定义的字段
      transform: true, // 自动转换类型（如把字符串转为数字）
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
