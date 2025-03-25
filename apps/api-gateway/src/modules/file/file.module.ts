import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigEnum } from '@shared/enum/config.enum';
import {
  DOWNLOAD_SERVICE_HOST,
  DOWNLOAD_SERVICE_NAME,
  DOWNLOAD_SERVICE_TCP_PORT,
  FILE_SERVICE_HOST,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
  UPLOAD_SERVICE_HOST,
  UPLOAD_SERVICE_NAME,
  UPLOAD_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>(ConfigEnum.SECRET),
          signOptions: {
            expiresIn: '1h', // 默认一小时
          },
        };
      },
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: UPLOAD_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: UPLOAD_SERVICE_HOST, port: UPLOAD_SERVICE_TCP_PORT },
      },
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: FILE_SERVICE_HOST, port: FILE_SERVICE_TCP_PORT },
      },
      {
        name: DOWNLOAD_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: DOWNLOAD_SERVICE_HOST,
          port: DOWNLOAD_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  providers: [FileService],
  controllers: [FileController],
  exports: [ClientsModule],
})
export class FileModule {}
