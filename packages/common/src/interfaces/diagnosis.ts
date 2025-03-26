import { DiagnosisConfig, DiagnosisResponse } from '@common/types/diagnosis';

export interface IDiagnosisService {
  diagnose(
    file: Buffer,
    fileName: string,
    config: DiagnosisConfig,
    token: string,
  ): Promise<DiagnosisResponse>;
}
