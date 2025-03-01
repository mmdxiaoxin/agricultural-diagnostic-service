import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
  PrimaryKey,
} from 'sequelize-typescript';
import { Datasets } from './datasets.model';
import { File } from './file.model';

@Table({ tableName: 'dataset_files', timestamps: true })
export class DatasetFiles extends Model<DatasetFiles> {
  @PrimaryKey
  @ForeignKey(() => Datasets)
  @Column(DataType.INTEGER)
  dataset_id!: number;

  @PrimaryKey
  @ForeignKey(() => File)
  @Column(DataType.INTEGER)
  file_id!: number;

  @CreatedAt
  @Column(DataType.DATE)
  created_at?: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at?: Date;

  // Associations
  @BelongsTo(() => Datasets)
  dataset!: Datasets;

  @BelongsTo(() => File)
  file!: File;
}
