import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 这里可以添加对请求的额外验证或处理
    console.log('Request made to:', req.originalUrl);
    next();
  }
}
