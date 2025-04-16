import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Dataset } from './dataset.entity';

@Entity('file')
@Index('file_user_id_fk', ['createdBy'])
@Index('file_user_id_fk_2', ['updatedBy'])
export class FileEntity extends BaseEntity {
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

  @Column({ type: 'int' })
  createdBy: number;

  @Column({ type: 'int' })
  updatedBy: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @ManyToMany(() => Dataset, (dataset) => dataset.files, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  datasets: Dataset[] | null;
}
