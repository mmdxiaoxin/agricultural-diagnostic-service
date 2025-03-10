import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @IsString({ message: '登陆必须为字符串类型！' })
  @IsNotEmpty({ message: '登陆输入不能为空！' })
  @ValidateIf((o) => /^\S+@\S+\.\S+$/.test(o.login)) // 如果是邮箱格式，执行邮箱验证
  @IsEmail({}, { message: '请输入有效的邮箱地址！' }) // 邮箱格式验证
  @ValidateIf((o) => !/^\S+@\S+\.\S+$/.test(o.login)) // 如果不是邮箱格式，认为它是用户名
  @Matches(/^[a-zA-Z0-9_-]{3,16}$/, {
    message: '用户名必须由3-16个字母、数字、下划线或破折号组成！',
  })
  @ApiProperty({
    description: '用户名/邮箱',
    example: 'admin',
  })
  login: string;

  @IsString({ message: '密码必须为字符串类型！' })
  @IsNotEmpty({ message: '密码输入不能为空！' })
  @ApiProperty({
    description: '密码',
    example: '123456',
  })
  password: string;
}
