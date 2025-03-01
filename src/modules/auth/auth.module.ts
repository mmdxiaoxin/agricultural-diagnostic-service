import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/common/utils/jwt.strategy';

const jwtModule = JwtModule.register({
  secret: 'secret-key', // 加密 key
  signOptions: { expiresIn: '120h' }, // 过期时间 - 这里设置是 5 天
});

@Module({
  imports: [jwtModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [jwtModule],
})
export class AuthModule {}
