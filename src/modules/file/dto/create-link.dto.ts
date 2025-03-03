import { IsOptional, IsString } from 'class-validator';

export class CreateTempLinkDto {
  @IsOptional()
  @IsString({ message: '链接过期时间必须为字符串类型！' })
  expiresIn?: string;
}
