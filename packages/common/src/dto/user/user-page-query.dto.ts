import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../page-query.dto';

export class UserPageQueryDto extends PageQueryDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
