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

  @ManyToOne(() => Crop, (crop) => crop.diseases)
  @JoinColumn({ name: 'cropId' })
  crop: Crop;

  @Column({ type: 'int', nullable: true })
  cropId: number;

  @Column({ type: 'text', nullable: true })
  cause: string;

  @Column({ type: 'text', nullable: true })
  transmission: string;

  @OneToMany(() => Symptom, (symptom) => symptom.disease)
  symptoms: Symptom[];

  @OneToMany(() => Treatment, (treatment) => treatment.disease)
  treatments: Treatment[];

  @OneToMany(() => EnvironmentFactor, (factor) => factor.disease)
  environmentFactors: EnvironmentFactor[];

  @OneToMany(() => DiagnosisRule, (rule) => rule.disease)
  diagnosisRules: DiagnosisRule[];
}
