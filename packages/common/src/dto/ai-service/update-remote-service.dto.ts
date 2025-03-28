import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CreateRemoteServiceDto } from './create-remote-service.dto';

export class UpdateRemoteServiceDto extends CreateRemoteServiceDto {}
