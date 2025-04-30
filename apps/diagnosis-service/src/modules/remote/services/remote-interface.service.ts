import { RemoteInterface, RemoteService } from '@app/database/entities';
import { CallRemoteInterfaceDto } from '@common/dto/remote/call-remote-interface.dto';
import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { UpdateRemoteInterfaceDto } from '@common/dto/remote/update-remote-interface.dto';
import { BaseResponse, HttpService } from '@common/services/http.service';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RedisService } from '@app/redis';

@Injectable()
export class RemoteInterfaceService {
  private readonly CACHE_KEYS = {
    REMOTE_SERVICE: 'remote:service',
    REMOTE_SERVICE_LIST: 'remote:service:list',
  } as const;

  constructor(
    @InjectRepository(RemoteService)
    private serviceRepository: Repository<RemoteService>,
    @InjectRepository(RemoteInterface)
    private interfaceRepository: Repository<RemoteInterface>,
    private dataSource: DataSource,
    private httpService: HttpService,
    private readonly redisService: RedisService,
  ) {}

  // 清除相关缓存
  private async clearRelatedCache(serviceId: number) {
    const patterns = [
      `${this.CACHE_KEYS.REMOTE_SERVICE_LIST}:*`,
      `${this.CACHE_KEYS.REMOTE_SERVICE}:${serviceId}`,
    ];

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  async getInterfaces(serviceId: number) {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['interfaces'],
    });
    return service?.interfaces;
  }

  async getInterfacesList(serviceId: number, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await this.interfaceRepository.findAndCount({
      where: { serviceId },
      skip,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async getInterfaceById(interfaceId: number) {
    return this.interfaceRepository.findOne({
      where: { id: interfaceId },
    });
  }

  async createInterface(serviceId: number, dto: CreateRemoteInterfaceDto) {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new RpcException({
        code: 404,
        message: '未找到当前服务',
      });
    }
    const interface_ = this.interfaceRepository.create({
      ...dto,
      service,
    });
    const savedInterface = await this.interfaceRepository.save(interface_);

    // 清除相关缓存
    await this.clearRelatedCache(serviceId);

    return savedInterface;
  }

  async updateInterface(interfaceId: number, dto: UpdateRemoteInterfaceDto) {
    const interface_ = await this.interfaceRepository.findOne({
      where: { id: interfaceId },
      relations: ['service'],
    });
    if (!interface_) {
      throw new RpcException({
        code: 404,
        message: '未找到当前接口',
      });
    }
    Object.assign(interface_, dto);
    const updatedInterface = await this.interfaceRepository.save(interface_);

    // 清除相关缓存
    await this.clearRelatedCache(interface_.service.id);

    return updatedInterface;
  }

  async removeInterface(interfaceId: number) {
    const interface_ = await this.interfaceRepository.findOne({
      where: { id: interfaceId },
      relations: ['service'],
    });
    if (!interface_) {
      throw new RpcException({
        code: 404,
        message: '未找到当前接口',
      });
    }
    const serviceId = interface_.service.id;
    await this.interfaceRepository.delete(interfaceId);

    // 清除相关缓存
    await this.clearRelatedCache(serviceId);
  }

  async copy(interfaceId: number): Promise<RemoteInterface> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const interface_ = await queryRunner.manager.findOne(RemoteInterface, {
        where: { id: interfaceId },
        relations: ['service'],
      });

      if (!interface_) {
        throw new RpcException({
          code: 404,
          message: '未找到当前接口',
        });
      }

      const { id, createdAt, updatedAt, ...interfaceData } = interface_;
      const newInterface = queryRunner.manager.create(RemoteInterface, {
        ...interfaceData,
        name: `${interfaceData.name}_copy`,
      });

      const savedInterface = await queryRunner.manager.save(newInterface);
      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(interface_.service.id);

      return savedInterface;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '复制接口失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async call(interfaceId: number, token: string, dto: CallRemoteInterfaceDto) {
    const { params, data } = dto;
    const interface_ = await this.interfaceRepository.findOne({
      where: { id: interfaceId },
    });

    if (!interface_) {
      throw new RpcException({
        code: 404,
        message: '未找到当前接口',
      });
    }

    const { url, config } = interface_;
    const method = config.method || 'GET';
    const path = config.path || '';
    const prefix = config.prefix || '';
    const headers = config.headers || {};
    const responseType = config.responseType || 'json';
    const timeout = config.timeout || 30000;
    const maxContentLength = config.maxContentLength;
    const maxBodyLength = config.maxBodyLength;
    const maxRedirects = config.maxRedirects;
    const withCredentials = config.withCredentials;
    const validateStatus = config.validateStatus;

    // 处理 URL
    const processedUrl = `${url}${prefix}${path}`;

    // 构建请求配置
    const requestConfig: any = {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': config.contentType || 'application/json',
      },
      timeout,
      responseType,
      validateStatus,
    };

    // 添加可选的配置项
    if (maxContentLength !== undefined) {
      requestConfig.maxContentLength = maxContentLength;
    }
    if (maxBodyLength !== undefined) {
      requestConfig.maxBodyLength = maxBodyLength;
    }
    if (maxRedirects !== undefined) {
      requestConfig.maxRedirects = maxRedirects;
    }
    if (withCredentials !== undefined) {
      requestConfig.withCredentials = withCredentials;
    }

    // 发送请求的函数
    const sendRequest = async <T = any>() => {
      let response: BaseResponse<T>;
      try {
        switch (method.toUpperCase()) {
          case 'GET':
            response = await this.httpService.get<T>(processedUrl, {
              ...requestConfig,
              params,
            });
            break;
          case 'POST':
            response = await this.httpService.post<T>(
              processedUrl,
              data || params,
              requestConfig,
            );
            break;
          case 'PUT':
            response = await this.httpService.put<T>(
              processedUrl,
              data || params,
              requestConfig,
            );
            break;
          case 'DELETE':
            response = await this.httpService.delete<T>(processedUrl, {
              ...requestConfig,
              params,
              data,
            });
            break;
          default:
            throw new RpcException({
              code: 400,
              message: `不支持的HTTP方法: ${method}`,
            });
        }

        if (!response) {
          throw new RpcException({
            code: 500,
            message: '接口响应为空',
          });
        }

        return response;
      } catch (error) {
        if (error instanceof RpcException) {
          throw error;
        }

        // 处理HTTP错误
        if (error.response) {
          throw new RpcException({
            code: error.response.status || 500,
            message: error.response.data?.message || '接口调用失败',
            data: error.response.data,
          });
        }

        // 处理网络错误
        if (error.request) {
          throw new RpcException({
            code: 503,
            message: '服务不可用',
            data: error.message,
          });
        }

        // 处理其他错误
        throw new RpcException({
          code: 500,
          message: '接口调用发生未知错误',
          data: error.message,
        });
      }
    };

    return sendRequest();
  }
}
