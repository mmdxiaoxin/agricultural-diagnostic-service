import { File as FileEntity } from '@app/database/entities';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('diagnosis_history')
@Index('diagnosis_history_created_by_idx', ['createdBy']) // 为 createdBy 字段添加索引
export class DiagnosisHistory extends BaseEntity {
  @ManyToOne(() => FileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fileId' }) // 关联的文件外键名
  file: FileEntity | null; // 上传的数据文件，允许为空（0..0关系）

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
}
