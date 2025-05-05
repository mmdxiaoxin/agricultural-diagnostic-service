import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { LogLevel } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const subnetIp = configService.get<string>('SUBNET_IP');

  // 从环境变量获取日志级别
  const logLevel = configService.get<string>('LOG_LEVEL', 'info').toLowerCase();

  // 定义日志级别映射
  const logLevelMap: Record<string, LogLevel[]> = {
    error: ['error'],
    warn: ['error', 'warn'],
    info: ['error', 'warn', 'log'],
    debug: ['error', 'warn', 'log', 'debug'],
    verbose: ['error', 'warn', 'log', 'debug', 'verbose'],
  };

  // 设置日志级别
  app.useLogger(logLevelMap[logLevel] || logLevelMap.info);

  // 配置CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      `http://${subnetIp}`,
      `https://${subnetIp}`,
      'http://www.binghai-zhenduan.com',
      'https://www.binghai-zhenduan.com',
      'http://www.mmdxiaoxin.top',
      'https://www.mmdxiaoxin.top',
      /\.binghai-zhenduan\.com$/,
      /\.mmdxiaoxin\.top$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // 允许发送cookies
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

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

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  console.log(
    `Metrics server is running on http://localhost:${process.env.PORT}/api/metrics`,
  );
}
bootstrap();
