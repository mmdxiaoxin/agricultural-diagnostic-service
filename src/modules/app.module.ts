import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';

@Module({
  imports: [AuthModule, UserModule, FileModule, KnowledgeModule, DiagnosisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
