import { File, Task } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEnum } from '@shared/enum/config.enum';
import {
  DOWNLOAD_SERVICE_NAME,
  DOWNLOAD_SERVICE_TCP_PORT,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
  UPLOAD_SERVICE_NAME,
  UPLOAD_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { FileController } from './file.controller';
import { FileOperationService } from './services/file-operation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, Task]),
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
        options: { host: 'localhost', port: UPLOAD_SERVICE_TCP_PORT },
      },
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: FILE_SERVICE_TCP_PORT },
      },
      {
        name: DOWNLOAD_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: DOWNLOAD_SERVICE_TCP_PORT },
      },
    ]),
  ],
  providers: [FileOperationService],
  controllers: [FileController],
  exports: [FileOperationService, ClientsModule],
})
export class FileModule {}
