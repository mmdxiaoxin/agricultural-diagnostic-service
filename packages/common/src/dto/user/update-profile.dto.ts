import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsNumber({}, { message: '性别必须为数字类型！' })
  @IsOptional()
  @ApiProperty({
    description: '性别',
    example: 1,
    required: false,
  })
  gender?: number;

  @IsString({ message: '昵称必须为字符串类型！' })
  @IsOptional()
  @ApiProperty({
    description: '姓名',
    example: '张三',
    required: false,
  })
  name?: string;

  @IsPhoneNumber('CN')
  @IsOptional()
  @ApiProperty({
    description: '手机号',
    example: '18888888888',
    required: false,
  })
  phone?: string;

  @IsString({ message: '地址必须为字符串类型！' })
  @IsOptional()
  @ApiProperty({
    description: '地址',
    example: '北京市朝阳区',
    required: false,
  })
  address?: string;
}
