import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // 生成 Token
  generateToken(data) {
    return this.jwtService.sign(data);
  }

  // 校验 Token
  verifyToken(token) {
    if (!token) return '';

    return this.jwtService.verify(token);
  }
}
