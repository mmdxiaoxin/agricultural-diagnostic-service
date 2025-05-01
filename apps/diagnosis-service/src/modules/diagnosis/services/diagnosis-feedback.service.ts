import {
  DiagnosisFeedback,
  DiagnosisHistory,
  FeedbackStatus,
} from '@app/database/entities';
import { CreateFeedbackDto } from '@common/dto/diagnosis/create-feedback.dto';
import { FeedbackQueryDto } from '@common/dto/diagnosis/feedback-query.dto';
import { UpdateFeedbackDto } from '@common/dto/diagnosis/update-feedback.dto';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class DiagnosisFeedbackService {
  private readonly logger = new Logger(DiagnosisFeedbackService.name);

  constructor(
    @InjectRepository(DiagnosisFeedback)
    private readonly feedbackRepository: Repository<DiagnosisFeedback>,
    private readonly dataSource: DataSource,
  ) {}

  // 创建反馈
  async createFeedback(userId: number, id: number, dto: CreateFeedbackDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 检查诊断记录是否存在
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id },
      });

      if (!diagnosis) {
        throw new RpcException('未找到诊断记录');
      }

      // 创建反馈记录
      const feedback = queryRunner.manager.create(DiagnosisFeedback, {
        diagnosis,
        feedbackContent: dto.feedbackContent,
        additionalInfo: dto.additionalInfo,
        status: FeedbackStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      });

      await queryRunner.manager.save(feedback);
      await queryRunner.commitTransaction();

      return formatResponse(200, feedback, '反馈提交成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(error);
      throw new RpcException({
        code: 500,
        message: '反馈提交失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 更新反馈状态（专家处理）
  async updateFeedback(
    feedbackId: number,
    expertId: number,
    dto: UpdateFeedbackDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const feedback = await queryRunner.manager.findOne(DiagnosisFeedback, {
        where: { id: feedbackId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!feedback) {
        throw new RpcException('未找到反馈记录');
      }

      // 更新反馈状态
      feedback.status = dto.status;
      feedback.expertId = expertId;
      feedback.expertComment = dto.expertComment ?? null;
      feedback.correctedResult = dto.correctedResult ?? null;
      feedback.updatedBy = expertId;

      await queryRunner.manager.save(feedback);
      await queryRunner.commitTransaction();

      return formatResponse(200, feedback, '反馈处理成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(error);
      throw new RpcException({
        code: 500,
        message: '反馈处理失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 获取反馈列表（分页）
  async getFeedbackList(userId: number, query: FeedbackQueryDto) {
    try {
      const [list, total] = await this.feedbackRepository.findAndCount({
        where: {
          createdBy: userId,
          ...(query.status && { status: query.status }),
        },
        relations: ['diagnosis'],
        order: { createdAt: 'DESC' },
        take: query.pageSize,
        skip: (query.page - 1) * query.pageSize,
      });

      return formatResponse(
        200,
        {
          list,
          total,
          page: query.page,
          pageSize: query.pageSize,
        },
        '获取反馈列表成功',
      );
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        code: 500,
        message: '获取反馈列表失败',
        data: error,
      });
    }
  }

  // 获取反馈详情
  async getFeedbackDetail(feedbackId: number, userId: number) {
    try {
      const feedback = await this.feedbackRepository.findOne({
        where: { id: feedbackId, createdBy: userId },
        relations: ['diagnosis'],
      });

      if (!feedback) {
        throw new RpcException('未找到反馈记录');
      }

      return formatResponse(200, feedback, '获取反馈详情成功');
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        code: 500,
        message: '获取反馈详情失败',
        data: error,
      });
    }
  }

  // 删除反馈
  async deleteFeedback(id: number) {
    await this.feedbackRepository.delete(id);

    return formatResponse(200, null, '反馈删除成功');
  }
}
