import { PartialType } from '@nestjs/mapped-types';
import { CreateAiModelDto } from './create-ai-model.dto';

export class UpdateAiModelDto extends PartialType(CreateAiModelDto) {}
