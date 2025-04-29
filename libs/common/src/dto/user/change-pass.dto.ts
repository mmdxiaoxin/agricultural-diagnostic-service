import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsString({ message: '新密码必顼为字符串类型' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(6, 20, { message: '密码长度必须为6-20位' })
  @ApiProperty({
    description: '新密码',
    example: '123456',
    required: true,
  })
  confirmPassword: string;
}
