import { File, Task } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEnum } from '@shared/enum/config.enum';
import { FileController } from './file.controller';
import { FileDownloadService } from './services/file-download.service';
import { FileManageService } from './services/file-manage.service';
import { FileOperationService } from './services/file-operation.service';
import { FileStorageService } from './services/file-storage.service';
import { FileUploadService } from './services/file-upload.service';
import { FileService } from './services/file.service';

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
  ],
  providers: [
    FileService,
    FileOperationService,
    FileDownloadService,
    FileUploadService,
    FileManageService,
    FileStorageService,
  ],
  controllers: [FileController],
  exports: [FileService, FileManageService, FileOperationService],
})
export class FileModule {}
