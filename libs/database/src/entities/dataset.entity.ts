import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { FileEntity } from './file.entity';

@Entity('dataset')
@Index('dataset_user_id_fk', ['createdBy'])
@Index('dataset_user_id_fk_2', ['updatedBy'])
export class Dataset extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 25, default: 'private' })
  access: string;

  @Column({ type: 'int' })
  createdBy: number;

  @Column({ type: 'int' })
  updatedBy: number;

  @ManyToMany(() => FileEntity, (file) => file.datasets, { nullable: true })
  @JoinTable({
    name: 'datasets_files', // 中间表的名字
    joinColumn: { name: 'datasetId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'fileId', referencedColumnName: 'id' },
  })
  files: FileEntity[] | null;
}
