import { Profile } from '@app/database/entities';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@shared/enum/user.enum';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确！' })
  @ApiProperty({
    description: '邮箱',
    example: '5165133@asdf.com',
    required: false,
  })
  email?: string;

  @IsOptional()
  @IsString({ message: '用户名必须为字符串类型！' })
  @Length(5, 20, { message: '用户名长度必须为5-20位！' })
  @ApiProperty({
    description: '用户名',
    example: 'sdfgsafgasgsad',
    required: false,
  })
  username?: string;

  @IsOptional()
  @IsString({ message: '密码必须为字符串类型！' })
  @Length(6, 20, { message: '密码长度必须为6-20位！' })
  @ApiProperty({
    description: '密码',
    example: '123456',
    required: false,
  })
  password?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: '状态值只能是 0 或 1' })
  @ApiProperty({
    description: '状态',
    example: 1,
    required: false,
  })
  status?: UserStatus; // 使用枚举来限制状态值

  @IsOptional()
  @IsArray({ message: '角色必须是数组！' })
  @ArrayMinSize(1, { message: '请至少选择一个角色！' })
  @ApiProperty({
    description: '角色',
    example: [1, 2],
    required: false,
  })
  roles?: number[];

  @IsOptional()
  @IsObject({ message: 'Profile 必须为一个对象！' })
  @IsOptional()
  @ApiProperty({
    description: 'Profile',
    type: Profile,
    required: false,
  })
  profile?: Profile;
}
