import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Crop } from './crop.entity';
import { DiagnosisRule } from './diagnosis-rule.entity';
import { EnvironmentFactor } from './environment-factor.entity';
import { Symptom } from './symptom.entity';
import { Treatment } from './treatment.entity';

@Entity()
export class Disease extends BaseEntity {
  @Column({ unique: true, comment: '病害名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '别名' })
  alias: string;

  @ManyToOne(() => Crop, (crop) => crop.diseases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cropId' })
  crop: Crop;

  @Column({ type: 'int', nullable: true })
  cropId: number;

  @Column({ type: 'text', nullable: true, comment: '病害原因' })
  cause: string;

  @Column({ type: 'text', nullable: true, comment: '传播途径' })
  transmission: string;

  @Column({ type: 'varchar', nullable: true, comment: '防治难度等级' })
  difficultyLevel: string;

  @OneToMany(() => Symptom, (symptom) => symptom.disease, { cascade: true })
  symptoms: Symptom[];

  @OneToMany(() => Treatment, (treatment) => treatment.disease, {
    cascade: true,
  })
  treatments: Treatment[];

  @OneToMany(() => EnvironmentFactor, (factor) => factor.disease, {
    cascade: true,
  })
  environmentFactors: EnvironmentFactor[];

  @OneToMany(() => DiagnosisRule, (rule) => rule.disease, { cascade: true })
  diagnosisRules: DiagnosisRule[];
}
