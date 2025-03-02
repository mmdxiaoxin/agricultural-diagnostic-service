import { IsOptional, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  @Length(6, 20, { message: '密码长度为6-20位' })
  password?: string;
}
