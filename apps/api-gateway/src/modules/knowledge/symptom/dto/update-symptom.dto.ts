import { PartialType } from '@nestjs/mapped-types';
import { CreateSymptomDto } from './create-symptom.dto';

export class UpdateSymptomDto extends PartialType(CreateSymptomDto) {}
