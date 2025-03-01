import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Dataset } from '../dataset/dataset.entity';

@Entity('file')
@Index('file_user_id_fk', ['createdBy'])
@Index('file_user_id_fk_2', ['updatedBy'])
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  originalFileName: string;

  @Column({ type: 'varchar', length: 255 })
  storageFileName: string;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100 })
  fileType: string;

  @Column({ type: 'char', length: 32 })
  fileMd5: string;

  @Column({ type: 'varchar', length: 30, default: 'private' })
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

  @Column({ type: 'int', default: 1 })
  version: number;

  // 多对多关系：一个 File 可能属于多个 Dataset
  @ManyToMany(() => Dataset, (dataset) => dataset.files)
  datasets: Dataset[];
}
