import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('病害智能诊断系统')
    .setDescription('病害智能诊断系统的API文档')
    .addBearerAuth() // 添加Bearer认证
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局异常过滤器
  app.useGlobalFilters(new OtherExceptionsFilter(), new HttpExceptionFilter());

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
