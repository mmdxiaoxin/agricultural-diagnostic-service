import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DiagnosisService } from '../services/diagnosis.service';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { Inject } from '@nestjs/common';

@Processor('diagnosis')
export class DiagnosisProcessor extends WorkerHost {
  private readonly logger = new Logger(DiagnosisProcessor.name);

  constructor(
    @Inject(DiagnosisService)
    private readonly diagnosisService: DiagnosisService,
  ) {
    super();
  }

  async process(
    job: Job<{
      diagnosisId: number;
      userId: number;
      dto: StartDiagnosisDto;
      token: string;
      fileId: number;
    }>,
  ) {
    this.logger.debug(`开始处理诊断任务 ${job.data.diagnosisId}`);

    try {
      await this.diagnosisService.executeDiagnosisAsync(
        job.data.diagnosisId,
        job.data.userId,
        job.data.dto,
        job.data.token,
        job.data.fileId,
      );

      this.logger.debug(`诊断任务 ${job.data.diagnosisId} 处理完成`);
    } catch (error) {
      this.logger.error(`诊断任务 ${job.data.diagnosisId} 处理失败:`, error);
      throw error;
    }
  }
}
