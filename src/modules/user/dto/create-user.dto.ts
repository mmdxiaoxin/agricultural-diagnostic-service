import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';
import { Role } from 'src/modules/role/role.entity';

export class CreateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @Length(5, 20, { message: '用户名长度必须为5-20位' })
  username: string;

  @IsOptional()
  @IsNumber()
  status?: 0 | 1;

  @IsOptional()
  @IsString()
  @Length(6, 64)
  password?: string;

  @IsOptional()
  @IsArray({ message: '角色必须是数组' })
  roles?: Role[] | number[];

  @IsOptional()
  @IsNumber()
  gender?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('CN')
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255, { message: '地址过长' })
  address?: string;
}
