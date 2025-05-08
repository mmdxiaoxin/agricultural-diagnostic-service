import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import {
  AUTH_SERVICE_HOST,
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './auth.strategy';

@Module({
  imports: [
    PassportModule,
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE_NAME,
        useFactory: () => ({
          transport: Transport.TCP,
          options: {
            host: AUTH_SERVICE_HOST,
            port: AUTH_SERVICE_TCP_PORT,
            keepalive: true,
            keepaliveInitialDelay: 15000,
            maxConnections: 20,
            maxRetries: 2,
            retryDelay: 500,
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
})
export class AuthModule {}
