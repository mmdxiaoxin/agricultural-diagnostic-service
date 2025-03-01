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
        host: configService.get<string>('MYSQL_HOST', 'localhost'),
        port: 3306,
        username: configService.get<string>('MYSQL_USER'),
        password: configService.get<string>('MYSQL_PASSWORD'),
        database: configService.get<string>('MYSQL_DATABASE'),
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
