import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { FeedbackStatus } from '@app/database/entities/diagnosis-feedback.entity';
import { PageQueryDto } from '../page-query.dto';

export class FeedbackQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  @ApiProperty({
    description: '反馈状态',
    required: false,
    enum: FeedbackStatus,
  })
  status?: FeedbackStatus;
}
