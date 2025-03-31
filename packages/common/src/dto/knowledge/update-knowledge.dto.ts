import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { CreateKnowledgeDto } from './create-knowledge.dto';

export class UpdateKnowledgeDto extends CreateKnowledgeDto {
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;
}
