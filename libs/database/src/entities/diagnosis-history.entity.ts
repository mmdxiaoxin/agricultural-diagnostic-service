import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DiagnosisLog } from './diagnosis-log.entity';
import { DiagnosisFeedback } from './diagnosis-feedback.entity';

export enum DiagnosisHistoryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  PROCESSING = 'processing',
}

@Entity('diagnosis_history')
@Index('diagnosis_history_file_id_idx', ['fileId'])
@Index('diagnosis_history_created_by_idx', ['createdBy'])
export class DiagnosisHistory extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  fileId: number | null;

  @Column({ type: 'json', nullable: true })
  diagnosisResult: any | null;

  @Column({
    type: 'enum',
    enum: DiagnosisHistoryStatus,
    default: DiagnosisHistoryStatus.PENDING,
    comment: '状态',
  })
  status: DiagnosisHistoryStatus;

  @Column({ type: 'int', comment: '创建者' })
  createdBy: number; // 创建者

  @Column({ type: 'int', comment: '更新者' })
  updatedBy: number; // 更新者

  @OneToMany(() => DiagnosisLog, (log) => log.diagnosis)
  logs: DiagnosisLog[];

  @OneToMany(() => DiagnosisFeedback, (feedback) => feedback.diagnosis)
  feedbacks: DiagnosisFeedback[];
}
