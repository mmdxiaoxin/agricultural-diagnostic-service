import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Consul = require('consul');
type ConsulType = typeof Consul;

export interface ConsulServiceOptions {
  host?: string;
  port?: number;
  serviceName?: string;
  servicePort?: number;
  healthCheckPath?: string;
  healthCheckInterval?: string;
  healthCheckTimeout?: string;
}

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private consul: ConsulType;
  private serviceId: string;
  private readonly options: Required<ConsulServiceOptions>;

  constructor(private configService: ConfigService) {
    this.options = {
      host: this.configService.get('CONSUL_HOST', 'localhost'),
      port: this.configService.get('CONSUL_PORT', 8500),
      serviceName: this.configService.get('SERVICE_NAME', 'unknown-service'),
      servicePort: this.configService.get('HTTP_PORT', 3000),
      healthCheckPath: this.configService.get('HEALTH_CHECK_PATH', '/health'),
      healthCheckInterval: this.configService.get(
        'HEALTH_CHECK_INTERVAL',
        '10s',
      ),
      healthCheckTimeout: this.configService.get('HEALTH_CHECK_TIMEOUT', '5s'),
    };

    this.consul = new Consul({
      host: this.options.host,
      port: this.options.port,
    });

    this.serviceId = `${this.options.serviceName}-${process.pid}`;
  }

  async onModuleInit() {
    await this.registerService();
  }

  async onModuleDestroy() {
    await this.deregisterService();
  }

  private async registerService() {
    try {
      await this.consul.agent.service.register({
        id: this.serviceId,
        name: this.options.serviceName,
        port: this.options.servicePort,
        check: {
          name: `${this.options.serviceName}-health-check`,
          http: `http://localhost:${this.options.servicePort}${this.options.healthCheckPath}`,
          interval: this.options.healthCheckInterval,
          timeout: this.options.healthCheckTimeout,
        },
      });
      console.log(
        `Service ${this.options.serviceName} registered successfully`,
      );
    } catch (error) {
      console.error('Failed to register service:', error);
    }
  }

  private async deregisterService() {
    try {
      await this.consul.agent.service.deregister(this.serviceId);
      console.log(
        `Service ${this.options.serviceName} deregistered successfully`,
      );
    } catch (error) {
      console.error('Failed to deregister service:', error);
    }
  }

  async discoverService(serviceName: string): Promise<string> {
    try {
      const result = await this.consul.catalog.service.nodes(serviceName);
      if (result && result.length > 0) {
        const service = result[0];
        return `http://${service.ServiceAddress}:${service.ServicePort}`;
      }
      throw new Error(`Service ${serviceName} not found`);
    } catch (error) {
      console.error(`Failed to discover service ${serviceName}:`, error);
      throw error;
    }
  }

  async getConfig(key: string): Promise<any> {
    try {
      const result = await this.consul.kv.get(key);
      if (!result || !result.Value) {
        return null;
      }
      return JSON.parse(result.Value);
    } catch (error) {
      console.error(`Failed to get config for key ${key}:`, error);
      throw error;
    }
  }

  async setConfig(key: string, value: any): Promise<void> {
    try {
      await this.consul.kv.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set config for key ${key}:`, error);
      throw error;
    }
  }
}
