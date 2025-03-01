import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { DatasetFiles } from './dataset_files.model';
import { Datasets } from './datasets.model';
import { User } from './user.model';

@Table({ tableName: 'file', timestamps: true })
export class File extends Model<File> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '原始文件名',
  })
  original_file_name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '存储文件名',
  })
  storage_file_name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '文件路径',
  })
  file_path!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: '文件大小',
  })
  file_size!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '文件类型（MIME类型）',
  })
  file_type!: string;

  @Column({
    type: DataType.CHAR(32),
    allowNull: false,
    comment: '文件的MD5值',
  })
  file_md5!: string;

  @Column({
    type: DataType.STRING(30),
    allowNull: false,
    defaultValue: 'private',
  })
  access!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '创建人',
  })
  created_by?: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '修改人',
  })
  updated_by?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 1,
  })
  declare version?: number;

  // Associations

  @BelongsTo(() => User, 'created_by')
  created_by_user!: User;

  @BelongsTo(() => User, 'updated_by')
  updated_by_user!: User;

  @HasMany(() => DatasetFiles, 'file_id')
  dataset_files!: DatasetFiles[];

  @BelongsToMany(() => Datasets, 'dataset_files', 'file_id', 'dataset_id')
  dataset_id_datasets!: Datasets[];
}
