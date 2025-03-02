import { IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsNumber()
  @IsOptional()
  gender?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsPhoneNumber('CN')
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
