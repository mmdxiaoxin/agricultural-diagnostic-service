import { IsOptional, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsOptional()
  @IsString({ message: '密码必须为字符串类型！' })
  @Length(6, 20, { message: '密码长度为6-20位！' })
  password?: string;
}
