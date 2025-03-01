import {
  Column,
  DataType,
  Model,
  Table,
  HasMany,
  BelongsToMany,
  ForeignKey,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { RolePermission } from './role_permission.model';

@Table({ tableName: 'permission', timestamps: true })
export class Permission extends Model<Permission> {
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
    unique: true,
  })
  name!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at?: Date;

  // Associations

  @BelongsToMany(() => Role, 'role_permission', 'permission_id', 'role_id')
  role_id_roles!: Role[];

  @HasMany(() => RolePermission, 'permission_id')
  role_permissions!: RolePermission[];
}
