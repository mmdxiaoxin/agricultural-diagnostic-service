import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Profile } from '../models/profile.entity';

export class CreateUserDto {
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确！' })
  email?: string;

  @IsOptional()
  @IsString({ message: '用户名必须为字符串类型！' })
  @Length(5, 20, { message: '用户名长度必须为5-20位！' })
  username?: string;

  @IsOptional()
  @IsString({ message: '密码必顼为字符串类型！' })
  @Length(6, 20, { message: '密码长度必须为6-20位！' })
  password?: string;

  @IsOptional()
  @IsNumber({}, { message: '状态必须为数字类型！' })
  status?: 0 | 1;

  @IsOptional()
  @IsArray({ message: '角色必须是数组！' })
  @ArrayMinSize(1, { message: '请至少选择一个角色！' })
  roles?: number[];

  @IsOptional()
  profile?: Profile;
}
