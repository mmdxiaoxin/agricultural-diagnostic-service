import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Menu } from './menu.entity';

@Entity('role')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, comment: '角色名称' })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '角色别名' })
  alias: string | null;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @ManyToMany(() => Menu, (menu) => menu.roles)
  menus: Menu[];

  static readonly BASIC_ROLES = [
    { name: 'admin', alias: '管理员' },
    { name: 'expert', alias: '专家' },
    { name: 'user', alias: '农户' },
  ];
}
