import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('diagnosis_history')
@Index('diagnosis_history_created_by_idx', ['createdBy']) // 可以加索引（可选）
export class DiagnosisHistory {
  @PrimaryGeneratedColumn('increment')
  id: number; // 主键ID

  @Column({ type: 'varchar', length: 255 })
  filePath: string; // 文件路径

  @Column({ type: 'varchar', length: 255 })
  fileName: string; // 文件名称

  @Column({ type: 'varchar', length: 25 })
  fileType: string; // 文件类型

  @Column({ type: 'varchar', length: 255, nullable: true })
  resultPath: string | null; // 结果路径

  @Column({ type: 'varchar', length: 255, nullable: true })
  diagnosisResult: string | null; // 诊断结果

  @Column({ type: 'float', nullable: true })
  diagnosisConfidence: number | null; // 诊断置信度

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
