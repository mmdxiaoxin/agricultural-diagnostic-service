import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

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

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  createdBy?: number;

  @Column({ type: 'int', nullable: true })
  updatedBy?: number;

  @VersionColumn()
  version: number;
}
