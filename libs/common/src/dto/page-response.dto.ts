import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class PageResponseDto<T> {
  @ApiProperty({
    description: '数据列表',
    isArray: true,
    type: () => Object,
  })
  list: T[];

  @ApiProperty({
    description: '总记录数',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '每页条数',
    example: 10,
  })
  pageSize: number;
}

// 创建一个工厂函数来生成带有正确类型信息的响应 DTO
export function createPageResponseDto<T>(
  classRef: Type<T>,
): Type<PageResponseDto<T>> {
  class PageResponseDtoClass extends PageResponseDto<T> {
    @ApiProperty({
      description: '数据列表',
      isArray: true,
      type: () => classRef,
    })
    declare list: T[];
  }

  return PageResponseDtoClass;
}
