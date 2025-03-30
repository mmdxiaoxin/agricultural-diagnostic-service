import {
  DiagnosisHistory,
  File as FileEntity,
  RemoteService,
} from '@app/database/entities';
import { LogLevel } from '@app/database/entities/diagnosis-log.entity';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { BaseResponse } from '@common/services/http.service';
import { DiagnosisConfig } from '@common/types/diagnosis';
import { GrpcDownloadService } from '@common/types/download/download.types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { Status } from '@shared/enum/status.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
} from 'config/microservice.config';
import { filter, get, isEmpty, isNil, sortBy } from 'lodash-es';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { DiagnosisHttpService } from './diagnosis-http.service';
import { DiagnosisLogService } from './diagnosis-log.service';

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);
  private downloadService: GrpcDownloadService;

  constructor(
    @Inject(FILE_SERVICE_NAME)
    private readonly fileClient: ClientProxy,
    @Inject(DOWNLOAD_SERVICE_NAME)
    private readonly downloadClient: ClientGrpc,
    @InjectRepository(RemoteService)
    private readonly remoteRepository: Repository<RemoteService>,
    private readonly dataSource: DataSource,
    private readonly diagnosisHttpService: DiagnosisHttpService,
    private readonly logService: DiagnosisLogService,
  ) {}

  onModuleInit() {
    this.downloadService =
      this.downloadClient.getService<GrpcDownloadService>('DownloadService');
  }

  // 后台执行诊断任务
  private async executeDiagnosisAsync(
    diagnosisId: number,
    userId: number,
    dto: StartDiagnosisDto,
    token: string,
    fileId: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 获取诊断记录
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id: diagnosisId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!diagnosis) {
        throw new Error('未找到诊断记录');
      }

      // 2. 获取远程服务配置
      const remoteService = await this.remoteRepository.findOne({
        where: { id: dto.serviceId },
        relations: ['interfaces', 'configs'],
      });
      if (!remoteService) {
        throw new Error('未找到远程服务配置');
      }

      // 3. 从服务配置中获取接口调用配置
      const remoteConfig = remoteService.configs.find(
        (config) => config.id === dto.configId,
      );
      if (!remoteConfig) {
        throw new Error('服务配置无接口配置');
      }
      const requests = remoteConfig.config.requests;
      if (!requests || requests.length === 0) {
        throw new Error('服务配置中未指定接口调用配置');
      }

      // 4. 按顺序获取接口配置
      const sortedRequests = sortBy(requests, 'order');
      const remoteInterfaces = new Map(
        remoteService.interfaces.map((interf) => [interf.id, interf]),
      );

      // 5. 获取文件
      const fileMeta = await this.getFileMeta(fileId);
      const fileData = await this.downloadFile(fileMeta);
      await this.logService.addLog(
        diagnosisId,
        LogLevel.INFO,
        `获取文件成功: ${fileMeta.originalFileName}`,
      );

      // 6. 按顺序调用接口
      const results = new Map<number, BaseResponse<any>>();

      // 递归调用接口
      const callInterfaces = async (
        requests: Array<{
          id: number;
          order: number;
          type: 'single' | 'polling';
          interval?: number;
          maxAttempts?: number;
          timeout?: number;
          retryCount?: number;
          retryDelay?: number;
          delay?: number;
          next?: number[];
          params?: Record<string, any>;
          pollingCondition?: {
            field: string;
            operator:
              | 'equals'
              | 'notEquals'
              | 'contains'
              | 'greaterThan'
              | 'lessThan'
              | 'exists'
              | 'notExists';
            value?: any;
          };
        }>,
      ) => {
        // 找出当前层级的接口（没有被其他接口依赖的接口）
        const currentRequests = filter(requests, (request) => {
          // 检查这个接口是否被其他接口依赖
          const isDependent = requests.some(
            (otherRequest) =>
              otherRequest.next && otherRequest.next.includes(request.id),
          );
          return !isDependent && !results.has(request.id);
        });

        if (isEmpty(currentRequests)) {
          return;
        }

        this.logger.debug(
          `当前层级接口: ${JSON.stringify(currentRequests.map((r) => r.id))}`,
        );

        // 并发调用当前层级的接口
        const promises = currentRequests.map(async (config) => {
          // 检查是否有依赖的接口，如果有，等待依赖接口完成后再等待指定的延时
          if (config.next && config.next.length > 0) {
            const lastDependencyId = config.next[config.next.length - 1];
            const lastDependency = requests.find(
              (r) => r.id === lastDependencyId,
            );

            if (lastDependency?.delay) {
              this.logger.debug(
                `等待依赖接口 ${lastDependencyId} 完成后的延时 ${lastDependency.delay}ms`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, lastDependency.delay),
              );
            }
          }

          // 检查当前接口是否有delay配置
          if (config.delay) {
            this.logger.debug(
              `等待当前接口 ${config.id} 的延时 ${config.delay}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, config.delay));
          }

          this.logger.debug(`准备调用接口 ${config.id}`);
          const remoteInterface = remoteInterfaces.get(config.id);
          if (!remoteInterface) {
            throw new Error(`未找到ID为 ${config.id} 的接口配置`);
          }

          const interfaceConfig = remoteInterface.config;

          const diagnosisConfig: DiagnosisConfig = {
            baseUrl: remoteInterface.url,
            urlPrefix: interfaceConfig.urlPrefix || '',
            urlPath: interfaceConfig.urlPath || '',
            requests: [
              {
                id: config.id,
                order: config.order,
                type: config.type,
                interval: config.interval,
                maxAttempts: config.maxAttempts,
                timeout: config.timeout,
                retryCount: config.retryCount,
                retryDelay: config.retryDelay,
                delay: config.delay,
                next: config.next,
                params: config.params,
                pollingCondition: config.pollingCondition,
              },
            ],
          };

          this.logger.debug(
            `接口 ${config.id} 的配置: ${JSON.stringify({
              path: interfaceConfig.path,
              method: interfaceConfig.method,
              urlPrefix: interfaceConfig.urlPrefix,
              urlPath: interfaceConfig.urlPath,
            })}`,
          );

          const result = await this.diagnosisHttpService.callInterface(
            diagnosisConfig,
            interfaceConfig.method || 'POST',
            interfaceConfig.path || '',
            config.params || fileData,
            token,
            results,
            fileMeta,
            fileData,
            diagnosisId,
          );

          await this.logService.addLog(
            diagnosisId,
            LogLevel.INFO,
            `接口 ${config.id} 调用完成`,
            {
              interfaceId: config.id,
              status: result.data?.status,
            },
          );
          results.set(config.id, result);
          return result;
        });

        await Promise.all(promises);
        await this.logService.addLog(
          diagnosisId,
          LogLevel.INFO,
          '当前层级接口调用完成',
          {
            results: Object.fromEntries(results),
          },
        );

        // 获取下一层级的接口
        const nextRequests = filter(requests, (request) => {
          // 检查这个接口的所有依赖是否都已经执行完成
          const allDependenciesCompleted =
            request.next?.every((id) => results.has(id)) ?? true; // 如果没有next数组，则认为依赖已完成
          const notExecuted = !results.has(request.id);
          this.logger.debug(
            `检查接口 ${request.id} 的依赖: ${JSON.stringify(request.next)}, 是否完成: ${allDependenciesCompleted}, 是否未执行: ${notExecuted}`,
          );
          return allDependenciesCompleted && notExecuted;
        });

        this.logger.debug(
          `下一层级接口: ${JSON.stringify(nextRequests.map((r) => r.id))}`,
        );

        // 递归调用下一层级的接口
        if (nextRequests.length > 0) {
          await callInterfaces(nextRequests);
        }
      };

      // 开始递归调用
      await callInterfaces(sortedRequests);

      this.logger.debug(`接口调用结果: ${JSON.stringify(results)}`);

      // 7. 获取最后一个接口的结果
      const lastResult = results.get(
        sortedRequests[sortedRequests.length - 1].id,
      );
      if (isNil(lastResult)) {
        throw new Error('接口调用失败，未获取到结果');
      }

      // 8. 更新诊断结果
      diagnosis.status = get(lastResult, 'data.status');
      diagnosis.diagnosisResult = get(lastResult, 'data');
      await queryRunner.manager.save(diagnosis);
      await this.logService.addLog(diagnosisId, LogLevel.INFO, '诊断任务完成', {
        status: diagnosis.status,
        result: get(lastResult, 'data'),
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error('后台诊断任务执行失败:', error);
      await this.logService.addLog(
        diagnosisId,
        LogLevel.ERROR,
        '诊断任务执行失败',
        {
          error: {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          },
        },
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getFileMeta(fileId: number): Promise<FileEntity> {
    const { success, result: fileMeta } = await lastValueFrom(
      this.fileClient.send(
        { cmd: FILE_MESSAGE_PATTERNS.GET_FILE_BY_ID },
        { fileId },
      ),
    );

    if (!success || !fileMeta) {
      throw new RpcException({
        code: 500,
        message: '获取文件失败',
      });
    }

    return fileMeta;
  }

  private async downloadFile(fileMeta: FileEntity): Promise<Buffer> {
    const { success, data } = await lastValueFrom(
      this.downloadService.downloadFile({ fileMeta }),
    );

    if (!success) {
      throw new RpcException({
        code: 500,
        message: '获取文件失败',
      });
    }

    // 直接返回 Buffer 数据
    return Buffer.isBuffer(data) ? data : Buffer.from(data);
  }

  // 创建诊断任务并获取诊断结果
  async startDiagnosis(
    diagnosisId: number,
    userId: number,
    dto: StartDiagnosisDto,
    token: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 获取诊断记录
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id: diagnosisId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!diagnosis) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '未找到诊断记录',
        );
        throw new RpcException({
          code: 500,
          message: '未找到诊断记录',
        });
      }
      if (diagnosis.createdBy !== userId) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '无权限操作此记录',
        );
        throw new RpcException({
          code: 500,
          message: '无权限操作此记录',
        });
      }

      // 2. 获取远程服务配置
      const remoteService = await this.remoteRepository.findOne({
        where: { id: dto.serviceId },
        relations: ['interfaces', 'configs'],
      });
      if (!remoteService) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '未找到远程服务配置',
        );
        throw new RpcException({
          code: 500,
          message: '未找到远程服务配置',
        });
      }

      // 3. 从服务配置中获取接口调用配置
      const remoteConfig = remoteService.configs.find(
        (config) => config.id === dto.configId,
      );
      if (!remoteConfig) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '服务配置无接口配置',
        );
        throw new RpcException({
          code: 500,
          message: '服务配置无接口配置',
        });
      }
      const requests = remoteConfig.config.requests;
      if (!requests || requests.length === 0) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '服务配置中未指定接口调用配置',
        );
        throw new RpcException({
          code: 500,
          message: '服务配置中未指定接口调用配置',
        });
      }

      // 4. 按顺序获取接口配置
      const sortedRequests = sortBy(requests, 'order');
      const remoteInterfaces = new Map(
        remoteService.interfaces.map((interf) => [interf.id, interf]),
      );

      // 5. 更新诊断状态
      diagnosis.status = Status.IN_PROGRESS;
      await queryRunner.manager.save(diagnosis);
      await this.logService.addLog(diagnosisId, LogLevel.INFO, '开始诊断任务', {
        status: Status.IN_PROGRESS,
      });

      // 6. 获取文件
      if (!diagnosis.fileId) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '无上传文件记录',
        );
        throw new RpcException({
          code: 404,
          message: '无上传文件记录',
        });
      }
      const fileMeta = await this.getFileMeta(diagnosis.fileId);
      const fileData = await this.downloadFile(fileMeta);
      await this.logService.addLog(
        diagnosisId,
        LogLevel.INFO,
        `获取文件成功: ${fileMeta.originalFileName}`,
      );

      // 7. 按顺序调用接口
      const results = new Map<number, BaseResponse<any>>();

      // 递归调用接口
      const callInterfaces = async (
        requests: Array<{
          id: number;
          order: number;
          type: 'single' | 'polling';
          interval?: number;
          maxAttempts?: number;
          timeout?: number;
          retryCount?: number;
          retryDelay?: number;
          delay?: number;
          next?: number[];
          params?: Record<string, any>;
          pollingCondition?: {
            field: string;
            operator:
              | 'equals'
              | 'notEquals'
              | 'contains'
              | 'greaterThan'
              | 'lessThan'
              | 'exists'
              | 'notExists';
            value?: any;
          };
        }>,
      ) => {
        // 找出当前层级的接口（没有被其他接口依赖的接口）
        const currentRequests = filter(requests, (request) => {
          // 检查这个接口是否被其他接口依赖
          const isDependent = requests.some(
            (otherRequest) =>
              otherRequest.next && otherRequest.next.includes(request.id),
          );
          return !isDependent && !results.has(request.id);
        });

        if (isEmpty(currentRequests)) {
          return;
        }

        this.logger.debug(
          `当前层级接口: ${JSON.stringify(currentRequests.map((r) => r.id))}`,
        );

        // 并发调用当前层级的接口
        const promises = currentRequests.map(async (config) => {
          // 检查是否有依赖的接口，如果有，等待依赖接口完成后再等待指定的延时
          if (config.next && config.next.length > 0) {
            const lastDependencyId = config.next[config.next.length - 1];
            const lastDependency = requests.find(
              (r) => r.id === lastDependencyId,
            );

            if (lastDependency?.delay) {
              this.logger.debug(
                `等待依赖接口 ${lastDependencyId} 完成后的延时 ${lastDependency.delay}ms`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, lastDependency.delay),
              );
            }
          }

          // 检查当前接口是否有delay配置
          if (config.delay) {
            this.logger.debug(
              `等待当前接口 ${config.id} 的延时 ${config.delay}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, config.delay));
          }

          this.logger.debug(`准备调用接口 ${config.id}`);
          const remoteInterface = remoteInterfaces.get(config.id);
          if (!remoteInterface) {
            throw new RpcException({
              code: 500,
              message: `未找到ID为 ${config.id} 的接口配置`,
            });
          }

          const interfaceConfig = remoteInterface.config;

          const diagnosisConfig: DiagnosisConfig = {
            baseUrl: remoteInterface.url,
            urlPrefix: interfaceConfig.urlPrefix || '',
            urlPath: interfaceConfig.urlPath || '',
            requests: [
              {
                id: config.id,
                order: config.order,
                type: config.type,
                interval: config.interval,
                maxAttempts: config.maxAttempts,
                timeout: config.timeout,
                retryCount: config.retryCount,
                retryDelay: config.retryDelay,
                delay: config.delay,
                next: config.next,
                params: config.params,
                pollingCondition: config.pollingCondition,
              },
            ],
          };

          this.logger.debug(
            `接口 ${config.id} 的配置: ${JSON.stringify({
              path: interfaceConfig.path,
              method: interfaceConfig.method,
              urlPrefix: interfaceConfig.urlPrefix,
              urlPath: interfaceConfig.urlPath,
            })}`,
          );

          const result = await this.diagnosisHttpService.callInterface(
            diagnosisConfig,
            interfaceConfig.method || 'POST',
            interfaceConfig.path || '',
            config.params || fileData,
            token,
            results,
            fileMeta,
            fileData,
            diagnosisId,
          );

          await this.logService.addLog(
            diagnosisId,
            LogLevel.INFO,
            `接口 ${config.id} 调用完成`,
            {
              interfaceId: config.id,
              status: result.data?.status,
            },
          );
          results.set(config.id, result);
          return result;
        });

        await Promise.all(promises);
        await this.logService.addLog(
          diagnosisId,
          LogLevel.INFO,
          '当前层级接口调用完成',
          {
            results: Object.fromEntries(results),
          },
        );

        // 获取下一层级的接口
        const nextRequests = filter(requests, (request) => {
          // 检查这个接口的所有依赖是否都已经执行完成
          const allDependenciesCompleted =
            request.next?.every((id) => results.has(id)) ?? true; // 如果没有next数组，则认为依赖已完成
          const notExecuted = !results.has(request.id);
          this.logger.debug(
            `检查接口 ${request.id} 的依赖: ${JSON.stringify(request.next)}, 是否完成: ${allDependenciesCompleted}, 是否未执行: ${notExecuted}`,
          );
          return allDependenciesCompleted && notExecuted;
        });

        this.logger.debug(
          `下一层级接口: ${JSON.stringify(nextRequests.map((r) => r.id))}`,
        );

        // 递归调用下一层级的接口
        if (nextRequests.length > 0) {
          await callInterfaces(nextRequests);
        }
      };

      // 开始递归调用
      await callInterfaces(sortedRequests);

      this.logger.debug(`接口调用结果: ${JSON.stringify(results)}`);

      // 8. 获取最后一个接口的结果
      const lastResult = results.get(
        sortedRequests[sortedRequests.length - 1].id,
      );
      if (isNil(lastResult)) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '接口调用失败，未获取到结果',
        );
        throw new RpcException({
          code: 500,
          message: '接口调用失败，未获取到结果',
        });
      }

      // 9. 更新诊断结果
      diagnosis.status = get(lastResult, 'data.status');
      diagnosis.diagnosisResult = get(lastResult, 'data');
      await queryRunner.manager.save(diagnosis);
      await this.logService.addLog(diagnosisId, LogLevel.INFO, '诊断任务完成', {
        status: diagnosis.status,
        result: get(lastResult, 'data'),
      });

      await queryRunner.commitTransaction();
      return formatResponse(
        200,
        get(lastResult, 'data'),
        '已经开始诊断，请稍后查看结果',
      );
    } catch (error) {
      this.logger.error(error);
      await this.logService.addLog(
        diagnosisId,
        LogLevel.ERROR,
        '开始诊断失败',
        {
          error: {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          },
        },
      );
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '开始诊断失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 异步创建诊断任务
  async startDiagnosisAsync(
    diagnosisId: number,
    userId: number,
    dto: StartDiagnosisDto,
    token: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 获取诊断记录
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id: diagnosisId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!diagnosis) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '未找到诊断记录',
        );
        throw new RpcException({
          code: 500,
          message: '未找到诊断记录',
        });
      }
      if (diagnosis.createdBy !== userId) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '无权限操作此记录',
        );
        throw new RpcException({
          code: 500,
          message: '无权限操作此记录',
        });
      }

      // 2. 获取远程服务配置
      const remoteService = await this.remoteRepository.findOne({
        where: { id: dto.serviceId },
        relations: ['interfaces', 'configs'],
      });
      if (!remoteService) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '未找到远程服务配置',
        );
        throw new RpcException({
          code: 500,
          message: '未找到远程服务配置',
        });
      }

      // 3. 从服务配置中获取接口调用配置
      const remoteConfig = remoteService.configs.find(
        (config) => config.id === dto.configId,
      );
      if (!remoteConfig) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '服务配置无接口配置',
        );
        throw new RpcException({
          code: 500,
          message: '服务配置无接口配置',
        });
      }
      const requests = remoteConfig.config.requests;
      if (!requests || requests.length === 0) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '服务配置中未指定接口调用配置',
        );
        throw new RpcException({
          code: 500,
          message: '服务配置中未指定接口调用配置',
        });
      }

      // 4. 检查文件是否存在
      if (!diagnosis.fileId) {
        await this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '无上传文件记录',
        );
        throw new RpcException({
          code: 404,
          message: '无上传文件记录',
        });
      }

      // 5. 更新诊断状态为进行中
      diagnosis.status = Status.IN_PROGRESS;
      await queryRunner.manager.save(diagnosis);
      await this.logService.addLog(diagnosisId, LogLevel.INFO, '开始诊断任务', {
        status: Status.IN_PROGRESS,
      });

      await queryRunner.commitTransaction();

      // 6. 在后台执行诊断任务
      this.executeDiagnosisAsync(
        diagnosisId,
        userId,
        dto,
        token,
        diagnosis.fileId,
      ).catch((error) => {
        this.logger.error('后台诊断任务执行失败:', error);
        this.logService.addLog(
          diagnosisId,
          LogLevel.ERROR,
          '诊断任务执行失败',
          {
            error: {
              message: error.message,
              stack: error.stack?.split('\n').slice(0, 3).join('\n'),
            },
          },
        );
      });

      return formatResponse(
        200,
        { diagnosisId },
        '诊断任务已开始，请稍后查看结果',
      );
    } catch (error) {
      this.logger.error(error);
      await this.logService.addLog(
        diagnosisId,
        LogLevel.ERROR,
        '开始诊断失败',
        {
          error: {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          },
        },
      );
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '开始诊断失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async diagnosisSupportGet() {
    const remoteList = await this.remoteRepository.find({
      where: { status: 'active' },
      relations: ['configs'],
    });

    // 过滤每个服务的 configs，只保留 status 为 active 的配置
    const filteredRemoteList = remoteList.map((remote) => ({
      ...remote,
      configs: remote.configs.filter((config) => config.status === 'active'),
    }));

    return formatResponse(200, filteredRemoteList, '获取诊断支持成功');
  }
}
