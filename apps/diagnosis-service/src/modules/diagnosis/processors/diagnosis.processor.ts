import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DIAGNOSIS_PROCESSOR } from '.';
import { DiagnosisService } from '../services/diagnosis.service';
import { RemoteConfig, RemoteService } from '@app/database/entities';

@Processor(DIAGNOSIS_PROCESSOR)
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
      dto: StartDiagnosisDto;
      token: string;
      fileId: number;
      remoteService: RemoteService;
      remoteConfig: RemoteConfig;
    }>,
  ) {
    this.logger.debug(`开始处理诊断任务 ${job.data.diagnosisId}`);

    try {
      await this.diagnosisService.executeDiagnosisAsync(
        job.data.diagnosisId,
        job.data.dto,
        job.data.token,
        job.data.fileId,
        job.data.remoteService,
        job.data.remoteConfig,
      );

      this.logger.debug(`诊断任务 ${job.data.diagnosisId} 处理完成`);
    } catch (error) {
      this.logger.error(`诊断任务 ${job.data.diagnosisId} 处理失败:`, error);
      throw error;
    }
  }
}
