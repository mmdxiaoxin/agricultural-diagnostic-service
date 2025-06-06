import { Column, Entity, JoinTable, ManyToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Profile } from './profile.entity';
import { Role } from './role.entity';

@Entity('user')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
    comment: '邮箱',
  })
  email: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
    comment: '用户名',
  })
  username: string | null;

  @Column({ type: 'varchar', length: 100, comment: '密码' })
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
}
