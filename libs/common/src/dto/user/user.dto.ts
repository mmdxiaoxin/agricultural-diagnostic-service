import { ApiProperty } from '@nestjs/swagger';
import { RoleDto } from '../role/role.dto';

export class UserProfileDto {
  @ApiProperty({
    description: '用户资料ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '性别 (0: 未知, 1: 男, 2: 女)',
    example: 1,
    enum: [0, 1, 2],
  })
  gender: number;

  @ApiProperty({
    description: '姓名',
    example: '张三',
  })
  name: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
  })
  phone: string;

  @ApiProperty({
    description: '地址',
    example: '北京市朝阳区xxx街道',
  })
  address: string;
}

export class UserDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '创建时间',
    example: '2024-03-20T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: '更新时间',
    example: '2024-03-20T10:00:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: '邮箱',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '用户名',
    example: 'zhangsan',
  })
  username: string;

  @ApiProperty({
    description: '用户状态 (0: 禁用, 1: 启用)',
    example: 1,
    enum: [0, 1],
  })
  status: number;

  @ApiProperty({
    description: '用户角色列表',
    type: [RoleDto],
  })
  roles: RoleDto[];

  @ApiProperty({
    description: '用户资料',
    type: UserProfileDto,
  })
  profile: UserProfileDto;
}
