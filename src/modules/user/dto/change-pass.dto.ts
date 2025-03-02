import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(6, 20, { message: '密码长度必须为6-20位' })
  confirmPassword: string;
}
