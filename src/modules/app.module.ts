import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { FileModule } from './file/file.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { UserModule } from './user/user.module';
import { ConfigEnum } from 'src/common/enum/config.enum';

@Module({
  imports: [
    // Add ConfigModule
    ConfigModule.forRoot({
      isGlobal: true, // Make the config globally accessible
    }),
    AuthModule,
    UserModule,
    FileModule,
    KnowledgeModule,
    DiagnosisModule,
    SequelizeModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get(ConfigEnum.DB_HOST),
        port: configService.get(ConfigEnum.DB_PORT),
        username: configService.get(ConfigEnum.DB_USERNAME),
        password: configService.get(ConfigEnum.DB_PASSWORD),
        database: configService.get(ConfigEnum.DB_DATABASE),
        autoLoadModels: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
