import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('diagnosis_support')
export class DiagnosisSupport extends BaseEntity {
  @Column({ type: 'varchar', length: 50, comment: '配置项' })
  key: string;

  @Column({ type: 'json', comment: '配置值' })
  value: {
    serviceId: number;
    configId: number;
  };

  @Column({ type: 'varchar', length: 200, comment: '配置描述' })
  description: string;
}
