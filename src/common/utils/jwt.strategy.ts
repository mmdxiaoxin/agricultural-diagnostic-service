import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'secret-key', // 加解密秘钥 key，后面 jwt register 也会使用到
    });
  }

  async validate(payload) {
    // 这里返回的数据会被注入到 @Req.user 对象内
    return payload;
  }
}
