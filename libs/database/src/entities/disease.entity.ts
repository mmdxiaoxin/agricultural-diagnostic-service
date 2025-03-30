import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Crop } from './crop.entity';

@Entity()
export class Disease extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  alias: string;

  @ManyToOne(() => Crop, (crop) => crop.id)
  crop: Crop;

  @Column({ type: 'text', nullable: true })
  cause: string;

  @Column({ type: 'text', nullable: true })
  transmission: string;
}
