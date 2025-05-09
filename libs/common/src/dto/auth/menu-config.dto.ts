import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class MenuConfigDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ description: '菜单ID', example: 1 })
  menuId: number;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ApiProperty({ description: '角色ID列表', example: [1, 2, 3] })
  roleIds: number[];
}
