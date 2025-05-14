import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
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
  retryAttempts?: number;
  retryDelay?: number;
}

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsulService.name);
  private consul: ConsulType;
  private serviceId: string;
  private readonly options: Required<ConsulServiceOptions>;
  private isRegistered = false;
  private isConsulAvailable = false;

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
      retryAttempts: this.configService.get('CONSUL_RETRY_ATTEMPTS', 5),
      retryDelay: this.configService.get('CONSUL_RETRY_DELAY', 5000),
    };

    try {
      this.consul = new Consul({
        host: this.options.host,
        port: this.options.port,
        promisify: true,
      });
      this.serviceId = `${this.options.serviceName}-${process.pid}`;
    } catch (error) {
      this.logger.error(`Failed to initialize Consul client: ${error.message}`);
      this.isConsulAvailable = false;
    }
  }

  async onModuleInit() {
    if (this.isConsulAvailable) {
      await this.registerServiceWithRetry();
    } else {
      this.logger.warn(
        'Consul service is not available, skipping service registration',
      );
    }
  }

  async onModuleDestroy() {
    if (this.isRegistered) {
      await this.deregisterService();
    }
  }

  private async registerServiceWithRetry() {
    let attempts = 0;
    while (attempts < this.options.retryAttempts) {
      try {
        await this.registerService();
        this.isRegistered = true;
        this.isConsulAvailable = true;
        return;
      } catch (error) {
        attempts++;
        this.logger.warn(
          `Failed to register service (attempt ${attempts}/${this.options.retryAttempts}): ${error.message}`,
        );
        if (attempts < this.options.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.options.retryDelay),
          );
        }
      }
    }
    this.logger.warn(
      'Failed to register service after all retry attempts, continuing without Consul',
    );
    this.isConsulAvailable = false;
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
      this.logger.log(
        `Service ${this.options.serviceName} registered successfully`,
      );
    } catch (error) {
      this.logger.error(`Failed to register service: ${error.message}`);
      throw error;
    }
  }

  private async deregisterService() {
    if (!this.isConsulAvailable) return;

    try {
      await this.consul.agent.service.deregister(this.serviceId);
      this.logger.log(
        `Service ${this.options.serviceName} deregistered successfully`,
      );
      this.isRegistered = false;
    } catch (error) {
      this.logger.error(`Failed to deregister service: ${error.message}`);
    }
  }

  async discoverService(serviceName: string): Promise<string> {
    if (!this.isConsulAvailable) {
      this.logger.warn(
        'Consul is not available, using default service discovery',
      );
      return `http://localhost:${this.options.servicePort}`;
    }

    try {
      const result = await this.consul.catalog.service.nodes(serviceName);
      if (result && result.length > 0) {
        const service = result[0];
        return `http://${service.ServiceAddress}:${service.ServicePort}`;
      }
      this.logger.warn(
        `Service ${serviceName} not found in Consul, using default service discovery`,
      );
      return `http://localhost:${this.options.servicePort}`;
    } catch (error) {
      this.logger.error(
        `Failed to discover service ${serviceName}: ${error.message}`,
      );
      return `http://localhost:${this.options.servicePort}`;
    }
  }

  async getConfig(key: string): Promise<any> {
    if (!this.isConsulAvailable) {
      this.logger.warn('Consul is not available, returning null for config');
      return null;
    }

    try {
      const result = await this.consul.kv.get(key);
      if (!result || !result.Value) {
        return null;
      }
      return JSON.parse(result.Value);
    } catch (error) {
      this.logger.error(
        `Failed to get config for key ${key}: ${error.message}`,
      );
      return null;
    }
  }

  async setConfig(key: string, value: any): Promise<void> {
    if (!this.isConsulAvailable) {
      this.logger.warn('Consul is not available, skipping config set');
      return;
    }

    try {
      await this.consul.kv.set(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error(
        `Failed to set config for key ${key}: ${error.message}`,
      );
    }
  }
}
