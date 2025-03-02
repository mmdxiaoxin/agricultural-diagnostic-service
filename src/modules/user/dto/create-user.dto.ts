import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Profile } from '../models/profile.entity';

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20, { message: '用户名长度必须为5-20位' })
  username?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20, { message: '密码长度必须为6-20位' })
  password?: string;

  @IsOptional()
  @IsNumber()
  status?: 0 | 1;

  @IsOptional()
  @IsArray({ message: '角色必须是数组' })
  @ArrayMinSize(1, { message: '请至少选择一个角色' })
  roles?: number[];

  @IsOptional()
  profile?: Profile;
}
