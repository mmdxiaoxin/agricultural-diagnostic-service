import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确！' })
  @IsNotEmpty({ message: '邮箱不能为空！' })
  email: string;

  @IsString({ message: '用户名必须为字符串类型！' })
  @IsNotEmpty({ message: '用户名不能为空！' })
  password: string;
}
