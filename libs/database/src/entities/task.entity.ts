import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('task')
export class Task extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  fileName: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  fileType: string;

  @Column({ type: 'int', nullable: false })
  fileSize: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  fileMd5?: string;

  @Column({ type: 'int', nullable: false })
  totalChunks: number;

  @Column({ type: 'int', default: 0, nullable: false })
  uploadedChunks: number;

  @Column({ type: 'varchar', length: 50, default: 'pending', nullable: true })
  status: string;

  @Column({ type: 'json', nullable: true })
  chunkStatus?: any;

  @Column({ type: 'int', nullable: true })
  createdBy?: number;

  @Column({ type: 'int', nullable: true })
  updatedBy?: number;

  @VersionColumn()
  version: number;
}
