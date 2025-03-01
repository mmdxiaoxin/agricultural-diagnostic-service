import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { Role } from 'src/modules/role/role.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password: string;

  roles?: Role[] | number[];
}
