import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('menu')
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  icon: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  path: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ nullable: true })
  parentId?: number;

  @Column({ type: 'varchar', nullable: true })
  isLink?: string;

  // 定义父级菜单（OneToMany）
  @ManyToOne(() => Menu, (menu) => menu.children)
  @JoinColumn({ name: 'parentId' })
  parent: Menu;

  // 定义子级菜单（OneToMany）
  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];

  @ManyToMany(() => Role, (role) => role.menus)
  @JoinTable({
    name: 'roles_menus',
    joinColumn: { name: 'menu_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles: Role[];
}
