import {
  Column,
  Model,
  Table,
  ForeignKey,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'diagnosis_history', timestamps: true })
export class DiagnosisHistory extends Model<DiagnosisHistory> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column(DataType.STRING(255))
  file_path!: string;

  @Column(DataType.STRING(255))
  file_name!: string;

  @Column(DataType.STRING(25))
  file_type!: string;

  @Column(DataType.STRING(255))
  result_path?: string;

  @Column(DataType.STRING(255))
  diagnosis_result?: string;

  @Column(DataType.FLOAT)
  diagnosis_confidence?: number;

  @Column({ type: DataType.STRING(25), defaultValue: 'pending' })
  status!: string;

  @Column(DataType.INTEGER)
  @ForeignKey(() => User)
  created_by!: number;

  @Column(DataType.INTEGER)
  @ForeignKey(() => User)
  updated_by!: number;

  @CreatedAt
  @Column(DataType.DATE)
  created_at?: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at?: Date;

  // Associations

  // diagnosis_history belongsTo user via created_by
  @BelongsTo(() => User, 'created_by')
  created_by_user!: User;

  // diagnosis_history belongsTo user via updated_by
  @BelongsTo(() => User, 'updated_by')
  updated_by_user!: User;
}
