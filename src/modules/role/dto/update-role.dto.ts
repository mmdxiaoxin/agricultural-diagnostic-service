import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string; // 角色名称

  @IsOptional()
  @IsString()
  alias?: string; // 角色别名

  @IsOptional()
  @IsString()
  description?: string; // 角色描述
}
