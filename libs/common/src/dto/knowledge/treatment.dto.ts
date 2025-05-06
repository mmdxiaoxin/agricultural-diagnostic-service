import { TreatmentType } from '@app/database/entities/treatment.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BaseDto } from '../base.dto';

export class TreatmentDto extends BaseDto {
  @IsEnum(TreatmentType)
  @ApiProperty({
    description: '治疗方式类型',
    required: true,
    enum: TreatmentType,
  })
  type: TreatmentType;

  @ApiProperty({ description: '治疗方式方法', required: true })
  method: string;

  @ApiProperty({ description: '推荐产品', required: false })
  recommendedProducts?: string;
}
