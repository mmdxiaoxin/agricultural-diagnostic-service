import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateDatasetAccessDto {
  @IsNotEmpty()
  @IsString()
  access: string;
}
