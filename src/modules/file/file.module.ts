import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './services/file.service';
import { File } from './models/file.entity';
import { Task } from './models/task.entity';
import { FileOperationService } from './services/file-operation.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@/common/enum/config.enum';
import { FileDownloadService } from './services/file-download.service';
import { FileUploadService } from './services/file-upload.service';
import { FileManageService } from './services/file-manage.service';
import { FileStorageService } from './services/file-storage.service';

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
  exports: [FileService],
})
export class FileModule {}
