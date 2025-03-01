import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      throw new ForbiddenException('用户已存在');
    }
    return this.usersService.create({ email, password });
  }
}
