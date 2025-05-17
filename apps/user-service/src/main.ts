import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';
import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  USER_SERVICE_GRPC_PORT,
  USER_SERVICE_HOST,
  USER_SERVICE_HTTP_PORT,
  USER_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { join } from 'path';
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

  // TCP 微服务
  const tcpMicroservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: USER_SERVICE_HOST,
      port: USER_SERVICE_TCP_PORT,
    },
  });

  // gRPC 微服务
  const grpcMicroservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(__dirname, 'proto/user.proto'),
      url: `${USER_SERVICE_HOST}:${USER_SERVICE_GRPC_PORT}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        arrays: true,
      },
    },
  });

  tcpMicroservice.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );
  grpcMicroservice.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );
  await app.startAllMicroservices();
  await app.listen(USER_SERVICE_HTTP_PORT, '0.0.0.0');

  console.log(
    `Metrics server is running on http://localhost:${USER_SERVICE_HTTP_PORT}/metrics`,
  );
}
bootstrap();
