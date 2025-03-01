import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const req = context.switchToHttp().getRequest();

    try {
      const accessToken = req.get('Authorization');

      if (!accessToken) {
        throw new HttpException('请先登录', HttpStatus.FORBIDDEN);
      }

      const atUserId = this.authService.verifyToken(accessToken);

      if (atUserId) {
        return this.activate(context);
      }
    } catch (error) {
      if (error.status) throw error;
      return false;
    }
  }

  async activate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }
}
