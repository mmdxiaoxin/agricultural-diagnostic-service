import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { FeedbackStatus } from '@app/database/entities/diagnosis-feedback.entity';

export class UpdateFeedbackDto {
  @IsNotEmpty()
  @IsEnum(FeedbackStatus)
  @ApiProperty({
    description: '反馈状态',
    required: true,
    enum: FeedbackStatus,
  })
  status: FeedbackStatus;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '专家处理意见', required: false })
  expertComment?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ description: '修正的诊断结果', required: false })
  correctedResult?: object;
}
