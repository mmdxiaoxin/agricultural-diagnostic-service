import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsulService, ConsulServiceOptions } from './consul.service';

@Global()
@Module({})
export class ConsulModule {
  static register(options: ConsulServiceOptions = {}): DynamicModule {
    return {
      module: ConsulModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'CONSUL_OPTIONS',
          useValue: options,
        },
        ConsulService,
      ],
      exports: [ConsulService],
    };
  }
}
