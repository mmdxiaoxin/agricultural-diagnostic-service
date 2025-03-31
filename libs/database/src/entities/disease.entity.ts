import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Crop } from './crop.entity';
import { DiagnosisRule } from './diagnosis-rule.entity';
import { EnvironmentFactor } from './environment-factor.entity';
import { Symptom } from './symptom.entity';
import { Treatment } from './treatment.entity';

@Entity()
export class Disease extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  alias: string;

  @ManyToOne(() => Crop, (crop) => crop.diseases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cropId' })
  crop: Crop;

  @Column({ type: 'int', nullable: true })
  cropId: number;

  @Column({ type: 'text', nullable: true })
  cause: string;

  @Column({ type: 'text', nullable: true })
  transmission: string;

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
