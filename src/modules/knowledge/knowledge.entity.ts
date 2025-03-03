import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('plant_disease_knowledge')
@Index('diseaseCode', ['diseaseCode'], { unique: true })
export class PlantDiseaseKnowledge {
  @PrimaryGeneratedColumn()
  id: number; // 唯一标识每条病害记录

  @Column({ type: 'varchar', length: 255, comment: '病害名称' })
  diseaseName: string; // 病害名称

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '病害唯一编码',
  })
  diseaseCode: string | null; // 病害唯一编码

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '病害的学名（如果有）',
  })
  scientificName: string | null; // 病害的学名（如果有）

  @Column({ type: 'text', nullable: true, comment: '病害的同义词' })
  synonyms: string | null; // 病害的同义词

  @Column({ type: 'text', nullable: true, comment: '病害症状描述' })
  symptoms: string | null; // 病害症状描述

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '病因' })
  cause: string | null; // 病因

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '病害类型' })
  diseaseType: string | null; // 病害类型

  @Column({ type: 'text', nullable: true, comment: '受影响的植物种类' })
  affectedPlant: string | null; // 受影响的植物种类

  @Column({ type: 'text', nullable: true, comment: '受影响的植物部位' })
  affectedPart: string | null; // 受影响的植物部位

  @Column({ type: 'text', nullable: true, comment: '病害生命周期' })
  diseaseCycle: string | null; // 病害生命周期

  @Column({ type: 'text', nullable: true, comment: '病害传播方式' })
  spreadMethod: string | null; // 病害传播方式

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '病害地理分布',
  })
  geographicalArea: string | null; // 病害地理分布

  @Column({ type: 'date', nullable: true, comment: '首次报告时间' })
  firstReported: string | null; // 首次报告时间

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '记录创建时间',
  })
  createdAt: Date; // 记录创建时间

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '记录更新时间',
  })
  updatedAt: Date; // 记录更新时间

  @Column({ type: 'text', nullable: true, comment: '防治措施' })
  preventiveMeasures: string | null; // 防治措施

  @Column({ type: 'text', nullable: true, comment: '化学防治方法' })
  chemicalControl: string | null; // 化学防治方法

  @Column({ type: 'text', nullable: true, comment: '生物防治方法' })
  biologicalControl: string | null; // 生物防治方法

  @Column({ type: 'text', nullable: true, comment: '文化控制措施' })
  culturalPractices: string | null; // 文化控制措施

  @Column({ type: 'text', nullable: true, comment: '抗病品种' })
  resistantVarieties: string | null; // 抗病品种

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '病害图片的 URL 地址',
  })
  imageUrl: string | null; // 病害图片的 URL 地址

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '相关文档的 URL 地址',
  })
  documentUrl: string | null; // 相关文档的 URL 地址

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '相关视频的 URL 地址',
  })
  videoUrl: string | null; // 相关视频的 URL 地址

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '病害分类' })
  category: string | null; // 病害分类

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '病害严重程度',
  })
  severity: string | null; // 病害严重程度

  @Column({ type: 'text', nullable: true, comment: '病害标签' })
  tags: string | null; // 病害标签

  @Column({ type: 'text', nullable: true, comment: '历史病例' })
  historicalCases: string | null; // 历史病例

  @Column({ type: 'text', nullable: true, comment: '研究来源' })
  researchSources: string | null; // 研究来源
}
