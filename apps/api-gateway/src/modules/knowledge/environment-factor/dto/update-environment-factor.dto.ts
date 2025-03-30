import { PartialType } from '@nestjs/mapped-types';
import { CreateEnvironmentFactorDto } from './create-environment-factor.dto';

export class UpdateEnvironmentFactorDto extends PartialType(CreateEnvironmentFactorDto) {}
