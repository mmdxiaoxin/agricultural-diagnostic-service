import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { FileController } from './file/file.controller';
import { KnowledgeController } from './knowledge/knowledge.controller';
import { DiagnosisController } from './diagnosis/diagnosis.controller';

@Module({
  imports: [],
  controllers: [AppController, AuthController, UserController, FileController, KnowledgeController, DiagnosisController],
  providers: [AppService],
})
export class AppModule {}
