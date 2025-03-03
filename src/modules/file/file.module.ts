import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { File } from './models/file.entity';
import { Task } from './models/task.entity';
import { FileOperationService } from './operation.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@/common/enum/config.enum';

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
  providers: [FileService, FileOperationService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
