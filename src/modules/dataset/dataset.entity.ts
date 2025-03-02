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

  // 多对多关系：一个 Dataset 可以有多个 File，一个 File 也可以属于多个 Dataset
  @ManyToMany(() => File, (file) => file.datasets)
  @JoinTable({
    name: 'datasets_files', // 中间表的名字
    joinColumn: { name: 'dataset_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'file_id', referencedColumnName: 'id' },
  })
  files: File[];
}
