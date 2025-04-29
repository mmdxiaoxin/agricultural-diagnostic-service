import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '角色名称',
    example: 'admin',
    required: false,
  })
  name?: string; // 角色名称

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '角色别名',
    example: '管理员',
    required: false,
  })
  alias?: string; // 角色别名

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '角色描述',
    example: '管理员角色',
    required: false,
  })
  description?: string; // 角色描述
}
