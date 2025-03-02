import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../role/role.entity';
import { Profile } from './profile.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'tinyint', default: 0 })
  status: 0 | 1;

  // 用户和角色是多对多关系
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({ name: 'users_roles' })
  roles: Role[];

  // 用户和个人信息是一对一关系
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
