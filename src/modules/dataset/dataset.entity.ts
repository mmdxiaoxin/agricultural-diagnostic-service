import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { File } from '../file/models/file.entity';

@Entity('dataset')
@Index('dataset_user_id_fk', ['createdBy'])
@Index('dataset_user_id_fk_2', ['updatedBy'])
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 25, default: 'private' })
  access: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ type: 'int' })
  createdBy: number;

  @Column({ type: 'int' })
  updatedBy: number;

  @ManyToMany(() => File, (file) => file.datasets, { nullable: true })
  @JoinTable({
    name: 'datasets_files', // 中间表的名字
    joinColumn: { name: 'datasetId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'fileId', referencedColumnName: 'id' },
  })
  files: File[] | null;
}
