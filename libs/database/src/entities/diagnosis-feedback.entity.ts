import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DiagnosisHistory } from './diagnosis-history.entity';

export enum FeedbackStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved', // 已解决
  REJECTED = 'rejected', // 已拒绝
}

@Entity('diagnosis_feedback')
@Index('diagnosis_feedback_diagnosis_id_idx', ['diagnosisId'])
@Index('diagnosis_feedback_created_by_idx', ['createdBy'])
export class DiagnosisFeedback extends BaseEntity {
  @Column({ type: 'int', comment: '诊断历史ID' })
  diagnosisId: number;

  @ManyToOne(() => DiagnosisHistory)
  @JoinColumn({ name: 'diagnosisId' })
  diagnosis: DiagnosisHistory;

  @Column({ type: 'text', comment: '用户反馈内容' })
  feedbackContent: string;

  @Column({ type: 'json', nullable: true, comment: '用户提供的补充信息' })
  additionalInfo: object | null;

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
    comment: '反馈状态',
  })
  status: FeedbackStatus;

  @Column({ type: 'int', nullable: true, comment: '处理专家ID' })
  expertId: number | null;

  @Column({ type: 'text', nullable: true, comment: '专家处理意见' })
  expertComment: string | null;

  @Column({ type: 'json', nullable: true, comment: '专家修正的诊断结果' })
  correctedResult: object | null;

  @Column({ type: 'int', comment: '创建者' })
  createdBy: number;

  @Column({ type: 'int', comment: '更新者' })
  updatedBy: number;
}
