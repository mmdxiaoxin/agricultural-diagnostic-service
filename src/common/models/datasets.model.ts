import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { DatasetFiles } from './dataset_files.model';
import { File } from './file.model';
import { User } from './user.model';

@Table({ tableName: 'datasets', timestamps: true })
export class Datasets extends Model<Datasets> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column(DataType.STRING(255))
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column({ type: DataType.STRING(25), defaultValue: 'private' })
  access!: string;

  @Column(DataType.INTEGER)
  @ForeignKey(() => User)
  created_by?: number;

  @Column(DataType.INTEGER)
  @ForeignKey(() => User)
  updated_by?: number;

  @CreatedAt
  @Column(DataType.DATE)
  created_at?: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at?: Date;

  // Associations

  // datasets hasMany dataset_files via dataset_id
  @HasMany(() => DatasetFiles)
  dataset_files!: DatasetFiles[];

  // datasets belongsToMany file via dataset_id and file_id
  @BelongsToMany(() => File, 'dataset_files', 'dataset_id', 'file_id')
  file_id_files!: File[];

  // datasets belongsTo user via created_by
  @BelongsTo(() => User, 'created_by')
  created_by_user!: User;

  // datasets belongsTo user via updated_by
  @BelongsTo(() => User, 'updated_by')
  updated_by_user!: User;
}
