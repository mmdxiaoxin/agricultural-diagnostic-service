import { IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @Length(6, 20, { message: '密码长度必须为6-20位' })
  confirmPassword: string;
}
