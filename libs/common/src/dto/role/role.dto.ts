import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({
    description: '角色ID',
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
    description: '角色名称',
    example: 'admin',
  })
  name: string;

  @ApiProperty({
    description: '角色别名',
    example: '管理员',
  })
  alias: string;
}
