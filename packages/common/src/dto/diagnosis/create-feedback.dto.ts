import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '诊断历史ID', required: true })
  diagnosisId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '反馈内容', required: true })
  feedbackContent: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ description: '补充信息', required: false })
  additionalInfo?: object;
}
