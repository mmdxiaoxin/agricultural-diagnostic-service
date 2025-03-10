import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { ConfigEnum } from '@shared/enum/config.enum';
import {
  USER_SERVICE_NAME,
  USER_SERVICE_PORT,
} from 'config/microservice.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './auth.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>(ConfigEnum.SECRET),
          signOptions: {
            expiresIn: '1d', // 默认一天
          },
        };
      },
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: USER_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: USER_SERVICE_PORT },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
