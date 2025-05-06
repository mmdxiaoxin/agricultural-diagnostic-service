import { ApiProperty } from '@nestjs/swagger';

// 路由项
export class RouteItemDto {
  @ApiProperty({
    description: '图标',
    example: 'HomeOutlined',
  })
  icon: string;

  @ApiProperty({
    description: '标题',
    example: '首页',
  })
  title: string;

  @ApiProperty({
    description: '路径',
    example: '/home/index',
  })
  path: string;

  @ApiProperty({
    description: '是否为外部链接',
    example: null,
    nullable: true,
  })
  isLink: boolean | null;

  @ApiProperty({
    description: '子路由',
    example: [
      {
        icon: 'ClusterOutlined',
        title: '第三方来源',
        path: '/knowledge/external',
        isLink: null,
        children: [],
      },
    ],
    type: [RouteItemDto],
    default: [],
  })
  children: RouteItemDto[];
}

// 路由列表
export class RouteDto {
  @ApiProperty({
    description: '路由列表',
    type: [RouteItemDto],
  })
  routes: RouteItemDto[];
}
