import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';
import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_GRPC_PORT,
  DOWNLOAD_SERVICE_HOST,
  DOWNLOAD_SERVICE_HTTP_PORT,
  DOWNLOAD_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TCP 微服务
  const tcpMicroservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: DOWNLOAD_SERVICE_HOST,
      port: DOWNLOAD_SERVICE_TCP_PORT,
    },
  });

  // gRPC 微服务
  const grpcMicroservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'download',
      protoPath: join(__dirname, 'proto/download.proto'),
      url: `${DOWNLOAD_SERVICE_HOST}:${DOWNLOAD_SERVICE_GRPC_PORT}`,
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

  // 添加全局过滤器
  tcpMicroservice.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );
  grpcMicroservice.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );

  // 启动所有微服务
  await app.startAllMicroservices();
  // 启动 HTTP 服务
  await app.listen(DOWNLOAD_SERVICE_HTTP_PORT);
}
bootstrap();
