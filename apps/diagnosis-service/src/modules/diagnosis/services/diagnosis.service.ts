import {
  DiagnosisHistory,
  DiagnosisHistoryStatus,
  FileEntity,
  RemoteService,
} from '@app/database/entities';
import { LogLevel } from '@app/database/entities/diagnosis-log.entity';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { GrpcDownloadService } from '@common/types/download/download.types';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { formatResponse } from '@shared/helpers/response.helper';
import { Queue } from 'bullmq';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
} from 'config/microservice.config';
import { get } from 'lodash-es';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { DIAGNOSIS_PROCESSOR } from '../processors';
import { DiagnosisLogService } from './diagnosis-log.service';
import { InterfaceCallManager } from './interface-call/core/interface-call.manager';
import { PollingOperator } from './interface-call/types/interface-call.types';

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
    private readonly logService: DiagnosisLogService,
    @InjectQueue(DIAGNOSIS_PROCESSOR)
    private readonly diagnosisQueue: Queue,
    private readonly interfaceCallManager: InterfaceCallManager,
  ) {}

  onModuleInit() {
    this.downloadService =
      this.downloadClient.getService<GrpcDownloadService>('DownloadService');
  }

  private async getFileMeta(fileId: number): Promise<FileEntity> {
    const { success, result: fileMeta } = await lastValueFrom(
      this.fileClient.send(
        { cmd: FILE_MESSAGE_PATTERNS.FILE_GET_BYID },
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

  // 执行诊断任务
  async executeDiagnosisAsync(
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

      // 4. 获取接口配置
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

      // 6. 初始化接口调用管理器
      const processedRequests = requests.map((request) => ({
        ...request,
        pollingCondition: request.pollingCondition
          ? {
              ...request.pollingCondition,
              operator: request.pollingCondition.operator as PollingOperator,
            }
          : undefined,
      }));

      this.interfaceCallManager.initialize(
        diagnosisId,
        processedRequests,
        remoteInterfaces,
      );

      // 7. 注册回调函数
      requests.forEach((request) => {
        this.interfaceCallManager.registerCallback(
          request.id,
          async (context) => {
            await this.logService.addLog(
              diagnosisId,
              LogLevel.INFO,
              `接口 ${request.id} 状态更新: ${context.state}`,
              {
                interfaceId: request.id,
                state: context.state,
                result: context.result,
                error: context.error,
              },
            );
          },
        );
      });

      // 8. 执行接口调用
      const results = await this.interfaceCallManager.execute({
        token,
        fileMeta,
        fileData,
      });

      // 9. 获取最后一个接口的结果
      const lastRequest = requests[requests.length - 1];
      const lastResult = results.get(lastRequest.id);
      if (!lastResult) {
        throw new Error('接口调用失败，未获取到结果');
      }

      // 10. 更新诊断结果
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

      // 4. 获取接口配置
      const remoteInterfaces = new Map(
        remoteService.interfaces.map((interf) => [interf.id, interf]),
      );

      // 5. 更新诊断状态
      diagnosis.status = DiagnosisHistoryStatus.PROCESSING;
      await queryRunner.manager.save(diagnosis);
      await this.logService.addLog(diagnosisId, LogLevel.INFO, '开始诊断任务', {
        status: DiagnosisHistoryStatus.PROCESSING,
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

      // 7. 初始化接口调用管理器
      const processedRequests = requests.map((request) => ({
        ...request,
        pollingCondition: request.pollingCondition
          ? {
              ...request.pollingCondition,
              operator: request.pollingCondition.operator as PollingOperator,
            }
          : undefined,
      }));

      this.interfaceCallManager.initialize(
        diagnosisId,
        processedRequests,
        remoteInterfaces,
      );

      // 8. 注册回调函数
      requests.forEach((request) => {
        this.interfaceCallManager.registerCallback(
          request.id,
          async (context) => {
            await this.logService.addLog(
              diagnosisId,
              LogLevel.INFO,
              `接口 ${request.id} 状态更新: ${context.state}`,
              {
                interfaceId: request.id,
                state: context.state,
                result: context.result,
                error: context.error,
              },
            );
          },
        );
      });

      // 9. 执行接口调用
      const results = await this.interfaceCallManager.execute({
        token,
        fileMeta,
        fileData,
      });

      // 10. 获取最后一个接口的结果
      const lastRequest = requests[requests.length - 1];
      const lastResult = results.get(lastRequest.id);
      if (!lastResult) {
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

      // 11. 更新诊断结果
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
      diagnosis.status = DiagnosisHistoryStatus.PROCESSING;
      await queryRunner.manager.save(diagnosis);
      await this.logService.addLog(diagnosisId, LogLevel.INFO, '开始诊断任务', {
        status: DiagnosisHistoryStatus.PROCESSING,
      });

      await queryRunner.commitTransaction();

      // 6. 将任务添加到队列
      await this.diagnosisQueue.add(
        'diagnosis',
        {
          diagnosisId,
          userId,
          dto,
          token,
          fileId: diagnosis.fileId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

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

    // 过滤每个服务的 configs，只保留 status 为 active 的配置,并排除敏感字段
    const filteredRemoteList = remoteList.map((remote) => ({
      id: remote.id,
      serviceName: remote.serviceName,
      serviceType: remote.serviceType,
      description: remote.description,
      status: remote.status,
      createdAt: remote.createdAt,
      updatedAt: remote.updatedAt,
      configs: remote.configs
        .filter((config) => config.status === 'active')
        .map((config) => ({
          id: config.id,
          name: config.name,
          description: config.description,
          status: config.status,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        })),
    }));

    return formatResponse(200, filteredRemoteList, '获取诊断支持成功');
  }
}
