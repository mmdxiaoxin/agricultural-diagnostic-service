import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '反馈内容', required: true })
  feedbackContent: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ description: '补充信息', required: false })
  additionalInfo?: object;
}
