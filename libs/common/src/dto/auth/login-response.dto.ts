import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: '过期时间（秒）',
    example: 86400,
  })
  expires_in: number;
}
