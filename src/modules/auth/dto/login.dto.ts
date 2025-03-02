import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString({ message: '登陆必须为字符串类型！' })
  @IsNotEmpty({ message: '登陆输入不能为空！' })
  login: string;

  @IsString({ message: '密码必须为字符串类型！' })
  @IsNotEmpty({ message: '密码输入不能为空！' })
  password: string;
}
