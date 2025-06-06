import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '角色名称',
    example: 'admin',
    required: true,
  })
  name: string; // 角色名称

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
