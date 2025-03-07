import { File as FileEntity } from '@/modules/file/models/file.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('diagnosis_history')
@Index('diagnosis_history_created_by_idx', ['createdBy']) // 为 createdBy 字段添加索引
export class DiagnosisHistory {
  @PrimaryGeneratedColumn('increment')
  id: number; // 主键ID

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

  @Column({
    type: 'datetime',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date; // 创建时间

  @Column({
    type: 'datetime',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date; // 更新时间
}
