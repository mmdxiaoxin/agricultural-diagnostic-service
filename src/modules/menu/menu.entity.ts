import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

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

  @Column({ nullable: true })
  parentId: number | null;

  @Column({ type: 'varchar', nullable: true })
  isLink: string | null;

  // 定义父级菜单（OneToMany）
  @ManyToOne(() => Menu, (menu) => menu.children)
  @JoinColumn({ name: 'parentId' })
  parent: Menu;

  // 定义子级菜单（OneToMany）
  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];
}
