import { FileOperationService } from '@app/file-operation';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiagnosisService } from './diagnosis.service';

@Controller()
export class DiagnosisController {
  constructor(
    private readonly diagnosisService: DiagnosisService,
    private readonly fileOperationService: FileOperationService,
  ) {}

  @MessagePattern({ cmd: 'diagnosis.upload' })
  async uploadData(
    @Payload() data: { userId: number; file: Express.Multer.File },
  ) {
    try {
      return this.diagnosisService.uploadData(data.userId, data.file);
    } catch (error) {
      await this.fileOperationService.deleteFile(data.file.path);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'diagnosis.start' })
  async startDiagnosis(@Payload() data: { id: number; userId: number }) {
    return await this.diagnosisService.startDiagnosis(data.id, data.userId);
  }

  @MessagePattern({ cmd: 'diagnosis.status' })
  async getDiagnosisStatus(@Payload() data: { id: number }) {
    return await this.diagnosisService.getDiagnosisStatus(data.id);
  }

  @MessagePattern({ cmd: 'diagnosis.history' })
  async diagnosisHistoryGet(@Payload() data: { userId: number }) {
    return await this.diagnosisService.diagnosisHistoryGet(data.userId);
  }

  @MessagePattern({ cmd: 'diagnosis.support' })
  async diagnosisSupportGet() {
    return await this.diagnosisService.diagnosisSupportGet();
  }

  @MessagePattern({ cmd: 'diagnosis.history.list' })
  async diagnosisHistoryListGet(
    @Payload() data: { page?: number; pageSize?: number; userId: number },
  ) {
    return await this.diagnosisService.diagnosisHistoryListGet(
      data.page,
      data.pageSize,
      data.userId,
    );
  }
}
