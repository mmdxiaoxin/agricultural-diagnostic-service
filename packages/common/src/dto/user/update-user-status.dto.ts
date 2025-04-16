import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsNumber()
  status: 0 | 1;
}
