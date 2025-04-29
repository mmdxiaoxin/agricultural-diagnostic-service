import { DiagnosisSupport } from '@app/database/entities/diagnosis-support.entity';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Repository } from 'typeorm';

@Injectable()
export class DiagnosisSupportService {
  private readonly logger = new Logger(DiagnosisSupportService.name);

  constructor(
    @InjectRepository(DiagnosisSupport)
    private readonly diagnosisSupportRepository: Repository<DiagnosisSupport>,
  ) {}

  // 创建诊断支持配置
  async create(
    key: string,
    value: { serviceId: number; configId: number },
    description: string,
  ) {
    try {
      const support = this.diagnosisSupportRepository.create({
        key,
        value,
        description,
      });
      const result = await this.diagnosisSupportRepository.save(support);
      return formatResponse(200, result, '创建诊断支持配置成功');
    } catch (error) {
      this.logger.error('创建诊断支持配置失败:', error);
      throw new RpcException({
        code: 500,
        message: '创建诊断支持配置失败',
        data: error,
      });
    }
  }

  // 获取诊断支持配置列表
  async findAll() {
    try {
      const supports = await this.diagnosisSupportRepository.find();
      return formatResponse(200, supports, '获取诊断支持配置列表成功');
    } catch (error) {
      this.logger.error('获取诊断支持配置列表失败:', error);
      throw new RpcException({
        code: 500,
        message: '获取诊断支持配置列表失败',
        data: error,
      });
    }
  }

  // 获取单个诊断支持配置
  async findOne(id: number) {
    try {
      const support = await this.diagnosisSupportRepository.findOne({
        where: { id },
      });
      if (!support) {
        throw new RpcException({
          code: 404,
          message: '未找到诊断支持配置',
        });
      }
      return formatResponse(200, support, '获取诊断支持配置成功');
    } catch (error) {
      this.logger.error('获取诊断支持配置失败:', error);
      throw new RpcException({
        code: error.code || 500,
        message: error.message || '获取诊断支持配置失败',
        data: error,
      });
    }
  }

  // 更新诊断支持配置
  async update(
    id: number,
    key: string,
    value: { serviceId: number; configId: number },
    description: string,
  ) {
    try {
      const support = await this.diagnosisSupportRepository.findOne({
        where: { id },
      });
      if (!support) {
        throw new RpcException({
          code: 404,
          message: '未找到诊断支持配置',
        });
      }

      support.key = key;
      support.value = value;
      support.description = description;

      const result = await this.diagnosisSupportRepository.save(support);
      return formatResponse(200, result, '更新诊断支持配置成功');
    } catch (error) {
      this.logger.error('更新诊断支持配置失败:', error);
      throw new RpcException({
        code: error.code || 500,
        message: error.message || '更新诊断支持配置失败',
        data: error,
      });
    }
  }

  // 删除诊断支持配置
  async remove(id: number) {
    try {
      const support = await this.diagnosisSupportRepository.findOne({
        where: { id },
      });
      if (!support) {
        throw new RpcException({
          code: 404,
          message: '未找到诊断支持配置',
        });
      }

      await this.diagnosisSupportRepository.remove(support);
      return formatResponse(200, null, '删除诊断支持配置成功');
    } catch (error) {
      this.logger.error('删除诊断支持配置失败:', error);
      throw new RpcException({
        code: error.code || 500,
        message: error.message || '删除诊断支持配置失败',
        data: error,
      });
    }
  }
}
