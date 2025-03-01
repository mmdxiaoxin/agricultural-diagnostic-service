import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Permission } from './permission.model';
import { RolePermission } from './role_permission.model';
import { User } from './user.model';

@Table({ tableName: 'role', timestamps: true })
export class Role extends Model<Role> {
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
    type: DataType.STRING(255),
    allowNull: true,
  })
  alias?: string;

  // Relations
  @BelongsToMany(() => Permission, () => RolePermission)
  permission_id_permissions!: Permission[];

  @HasMany(() => RolePermission)
  role_permissions!: RolePermission[];

  @HasMany(() => User)
  users!: User[];
}
