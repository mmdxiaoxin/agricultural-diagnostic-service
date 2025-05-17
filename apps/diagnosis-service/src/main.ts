import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  DIAGNOSIS_SERVICE_HOST,
  DIAGNOSIS_SERVICE_HTTP_PORT,
  DIAGNOSIS_SERVICE_TCP_PORT,
} from 'config/microservice.config';

import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';
import { LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
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
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: DIAGNOSIS_SERVICE_HOST,
      port: DIAGNOSIS_SERVICE_TCP_PORT,
    },
  });
  microservice.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );
  await app.startAllMicroservices();
  await app.listen(DIAGNOSIS_SERVICE_HTTP_PORT, '0.0.0.0');

  console.log(
    `Metrics server is running on http://localhost:${DIAGNOSIS_SERVICE_HTTP_PORT}/metrics`,
  );
}
bootstrap();
