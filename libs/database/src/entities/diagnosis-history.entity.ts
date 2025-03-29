import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DiagnosisLog } from './diagnosis-log.entity';

@Entity('diagnosis_history')
@Index('diagnosis_history_file_id_idx', ['fileId'])
@Index('diagnosis_history_created_by_idx', ['createdBy'])
export class DiagnosisHistory extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  fileId: number | null;

  @Column({ type: 'json', nullable: true })
  diagnosisResult: object | null;

  @Column({
    type: 'varchar',
    length: 25,
    default: 'pending',
  })
  status: string; // 状态（默认值为 'pending'）

  @Column({ type: 'int' })
  createdBy: number; // 创建者

  @Column({ type: 'int' })
  updatedBy: number; // 更新者

  @OneToMany(() => DiagnosisLog, (log) => log.diagnosis)
  logs: DiagnosisLog[];
}
