import { Crop, Disease } from '@app/database/entities';
import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { PageQueryKnowledgeDto } from '@common/dto/knowledge/page-query-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Like, Repository } from 'typeorm';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectRepository(Disease)
    private diseaseRepository: Repository<Disease>,
    @InjectRepository(Crop)
    private cropRepository: Repository<Crop>,
  ) {}

  // 创建知识
  async create(dto: CreateKnowledgeDto) {
    const queryRunner =
      this.diseaseRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 验证作物是否存在
      const crop = await this.cropRepository.findOne({
        where: { id: dto.cropId },
      });
      if (!crop) {
        throw new RpcException({
          code: 404,
          message: `Crop with ID ${dto.cropId} not found`,
        });
      }

      // 2. 创建病害基本信息
      const disease = this.diseaseRepository.create({
        name: dto.name,
        alias: dto.alias,
        crop,
        cause: dto.cause,
        transmission: dto.transmission,
        difficultyLevel: dto.difficultyLevel,
      });

      // 3. 保存病害基本信息
      const savedDisease = await queryRunner.manager.save(disease);

      // 4. 处理症状
      if (dto.symptoms && dto.symptoms.length > 0) {
        const symptoms = dto.symptoms.map((symptom) => ({
          ...symptom,
          disease: savedDisease,
        }));
        await queryRunner.manager.save('symptom', symptoms);
      }

      // 5. 处理治疗方案
      if (dto.treatments && dto.treatments.length > 0) {
        const treatments = dto.treatments.map((treatment) => ({
          ...treatment,
          disease: savedDisease,
        }));
        await queryRunner.manager.save('treatment', treatments);
      }

      // 6. 处理环境因素
      if (dto.environmentFactors && dto.environmentFactors.length > 0) {
        const environmentFactors = dto.environmentFactors.map((factor) => ({
          ...factor,
          disease: savedDisease,
        }));
        await queryRunner.manager.save(
          'environment_factor',
          environmentFactors,
        );
      }

      // 7. 处理诊断规则
      if (dto.diagnosisRules && dto.diagnosisRules.length > 0) {
        const diagnosisRules = dto.diagnosisRules.map((rule) => ({
          ...rule,
          disease: savedDisease,
        }));
        await queryRunner.manager.save('diagnosis_rule', diagnosisRules);
      }

      // 8. 重新获取完整的病害信息（包含所有关联数据）
      const completeDisease = await queryRunner.manager.findOne(Disease, {
        where: { id: savedDisease.id },
        relations: [
          'crop',
          'symptoms',
          'treatments',
          'environmentFactors',
          'diagnosisRules',
        ],
      });

      await queryRunner.commitTransaction();
      return formatResponse(201, completeDisease, '知识创建成功');
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 获取所有知识
  async findAll() {
    const diseases = await this.diseaseRepository.find({
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });
    return formatResponse(200, diseases, '知识列表获取成功');
  }

  // 获取知识列表
  async findList(query: PageQueryKnowledgeDto) {
    const { page = 1, pageSize = 10, keyword, cropId } = query;

    const queryBuilder = this.diseaseRepository
      .createQueryBuilder('disease')
      .leftJoinAndSelect('disease.crop', 'crop')
      .leftJoinAndSelect('disease.symptoms', 'symptoms')
      .leftJoinAndSelect('disease.treatments', 'treatments')
      .leftJoinAndSelect('disease.environmentFactors', 'environmentFactors')
      .leftJoinAndSelect('disease.diagnosisRules', 'diagnosisRules');

    if (keyword) {
      queryBuilder.where([
        { name: Like(`%${keyword}%`) },
        { alias: Like(`%${keyword}%`) },
      ]);
    }

    if (cropId) {
      queryBuilder.andWhere('disease.cropId = :cropId', { cropId });
    }

    const [diseases, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return formatResponse(
      200,
      { list: diseases, total, page, pageSize },
      '知识列表获取成功',
    );
  }

  // 根据ID获取知识
  async findById(id: number) {
    const disease = await this.diseaseRepository.findOne({
      where: { id },
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Knowledge with ID ${id} not found`,
      });
    }
    return formatResponse(200, disease, '知识详情获取成功');
  }

  // 更新知识
  async update(id: number, dto: UpdateKnowledgeDto) {
    const queryRunner =
      this.diseaseRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 验证病害是否存在
      const disease = await this.diseaseRepository.findOne({
        where: { id },
        relations: [
          'symptoms',
          'treatments',
          'environmentFactors',
          'diagnosisRules',
        ],
      });
      if (!disease) {
        throw new RpcException({
          code: 404,
          message: `Knowledge with ID ${id} not found`,
        });
      }

      // 2. 如果作物ID发生变化，验证新作物是否存在
      if (dto.cropId && dto.cropId !== disease.cropId) {
        const crop = await this.cropRepository.findOne({
          where: { id: dto.cropId },
        });
        if (!crop) {
          throw new RpcException({
            code: 404,
            message: `Crop with ID ${dto.cropId} not found`,
          });
        }
        disease.crop = crop;
      }

      // 3. 更新基本信息
      Object.assign(disease, {
        name: dto.name,
        alias: dto.alias,
        cause: dto.cause,
        transmission: dto.transmission,
        difficultyLevel: dto.difficultyLevel,
      });

      // 4. 保存更新后的病害信息
      const updatedDisease = await queryRunner.manager.save(disease);

      // 5. 处理症状更新
      if (dto.symptoms) {
        // 删除原有症状
        if (disease.symptoms && disease.symptoms.length > 0) {
          await queryRunner.manager.remove(disease.symptoms);
        }
        // 创建新的症状
        if (dto.symptoms.length > 0) {
          const symptoms = dto.symptoms.map((symptom) => ({
            ...symptom,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save('symptom', symptoms);
        }
      }

      // 6. 处理治疗方案更新
      if (dto.treatments) {
        // 删除原有治疗方案
        if (disease.treatments && disease.treatments.length > 0) {
          await queryRunner.manager.remove(disease.treatments);
        }
        // 创建新的治疗方案
        if (dto.treatments.length > 0) {
          const treatments = dto.treatments.map((treatment) => ({
            ...treatment,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save('treatment', treatments);
        }
      }

      // 7. 处理环境因素更新
      if (dto.environmentFactors) {
        // 删除原有环境因素
        if (
          disease.environmentFactors &&
          disease.environmentFactors.length > 0
        ) {
          await queryRunner.manager.remove(disease.environmentFactors);
        }
        // 创建新的环境因素
        if (dto.environmentFactors.length > 0) {
          const environmentFactors = dto.environmentFactors.map((factor) => ({
            ...factor,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save(
            'environment_factor',
            environmentFactors,
          );
        }
      }

      // 8. 处理诊断规则更新
      if (dto.diagnosisRules) {
        // 删除原有诊断规则
        if (disease.diagnosisRules && disease.diagnosisRules.length > 0) {
          await queryRunner.manager.remove(disease.diagnosisRules);
        }
        // 创建新的诊断规则
        if (dto.diagnosisRules.length > 0) {
          const diagnosisRules = dto.diagnosisRules.map((rule) => ({
            ...rule,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save('diagnosis_rule', diagnosisRules);
        }
      }

      // 9. 重新获取完整的病害信息（包含所有关联数据）
      const completeDisease = await queryRunner.manager.findOne(Disease, {
        where: { id: updatedDisease.id },
        relations: [
          'crop',
          'symptoms',
          'treatments',
          'environmentFactors',
          'diagnosisRules',
        ],
      });

      await queryRunner.commitTransaction();
      return formatResponse(200, completeDisease, '知识更新成功');
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 删除知识
  async remove(id: number) {
    const queryRunner =
      this.diseaseRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const disease = await this.diseaseRepository.findOne({ where: { id } });
      if (!disease) {
        throw new RpcException({
          code: 404,
          message: `Knowledge with ID ${id} not found`,
        });
      }

      await queryRunner.manager.remove(disease);

      await queryRunner.commitTransaction();
      return formatResponse(204, null, '知识删除成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
