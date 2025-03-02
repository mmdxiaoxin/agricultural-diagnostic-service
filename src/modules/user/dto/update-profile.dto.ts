import { IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsNumber({}, { message: '性别必须为数字类型！' })
  @IsOptional()
  gender?: number;

  @IsString({ message: '昵称必须为字符串类型！' })
  @IsOptional()
  name?: string;

  @IsPhoneNumber('CN')
  @IsOptional()
  phone?: string;

  @IsString({ message: '地址必须为字符串类型！' })
  @IsOptional()
  address?: string;
}
