import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import {
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_HTTP_PORT,
} from 'config/microservice.config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './auth.strategy';

@Module({
  imports: [
    PassportModule,
    ClientsModule.register([
      {
        name: AUTH_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: AUTH_SERVICE_HTTP_PORT },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
})
export class AuthModule {}
