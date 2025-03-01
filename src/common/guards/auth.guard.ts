import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

export interface UserPayload {
  userId: number;
  roles: string[];
  username?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: UserPayload;
    }
  }
}

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private configService: ConfigService) {
    super();
  }
}
