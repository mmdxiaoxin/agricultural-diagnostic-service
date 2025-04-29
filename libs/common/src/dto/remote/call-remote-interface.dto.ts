import { IsObject, IsOptional } from 'class-validator';

export class CallRemoteInterfaceDto {
  @IsOptional()
  @IsObject()
  params?: any;

  @IsOptional()
  @IsObject()
  data?: any;
}
