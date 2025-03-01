import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Avatar } from './avatar.model';
import { Datasets } from './datasets.model';
import { DiagnosisHistory } from './diagnosis_history.model';
import { File } from './file.model';
import { Role } from './role.model';

@Table({ tableName: 'user', timestamps: true })
export class User extends Model<User> {
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
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: 'username',
  })
  username?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password!: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  role_id!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: 0,
  })
  status!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  name?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  phone?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  address?: string;

  // Relations
  @BelongsTo(() => Role)
  role!: Role;

  @HasMany(() => Avatar)
  avatars!: Avatar[];

  @HasMany(() => Datasets)
  datasets!: Datasets[];

  @HasMany(() => Datasets, { foreignKey: 'updated_by' })
  updated_by_datasets!: Datasets[];

  @HasMany(() => DiagnosisHistory)
  diagnosis_histories!: DiagnosisHistory[];

  @HasMany(() => DiagnosisHistory, { foreignKey: 'updated_by' })
  updated_by_diagnosis_histories!: DiagnosisHistory[];

  @HasMany(() => File)
  files!: File[];

  @HasMany(() => File, { foreignKey: 'updated_by' })
  updated_by_files!: File[];
}
