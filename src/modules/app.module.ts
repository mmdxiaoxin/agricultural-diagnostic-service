import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    AuthModule,
    UserModule,
    FileModule,
    KnowledgeModule,
    DiagnosisModule,
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.MYSQL_HOST || 'localhost',
      port: 3306,
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      models: [],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
