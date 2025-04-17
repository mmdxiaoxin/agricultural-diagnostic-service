import { AliOssService } from '@app/ali-oss';
import { Disease, Symptom } from '@app/database/entities';
import { CreateSymptomDto } from '@common/dto/knowledge/create-symptom.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateSymptomDto } from '@common/dto/knowledge/update-symptom.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import axios from 'axios';
import { Like, Repository } from 'typeorm';

@Injectable()
export class SymptomService {
  constructor(
    @InjectRepository(Symptom) private symptomRepository: Repository<Symptom>,
    @InjectRepository(Disease) private diseaseRepository: Repository<Disease>,
    private readonly aliOssService: AliOssService,
  ) {}

  // 创建症状
  async create(dto: CreateSymptomDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${dto.diseaseId} not found`,
      });
    }
    const symptom = this.symptomRepository.create({ ...dto, disease });
    await this.symptomRepository.save(symptom);
    return formatResponse(201, symptom, '症状创建成功');
  }

  // 获取所有症状
  async findAll() {
    const symptoms = await this.symptomRepository.find({
      relations: ['disease'],
    });
    return formatResponse(200, symptoms, '症状列表获取成功');
  }

  async findList(query: PageQueryKeywordsDto) {
    const { page = 1, pageSize = 10, keyword = '' } = query;
    const [symptoms, total] = await this.symptomRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: [{ description: Like(`%${keyword}%`) }],
      relations: ['disease'],
    });
    return formatResponse(
      200,
      { list: symptoms, total, page, pageSize },
      '症状列表获取成功',
    );
  }

  // 根据ID获取症状
  async findById(id: number) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!symptom) {
      throw new RpcException({
        code: 404,
        message: `Symptom with ID ${id} not found`,
      });
    }
    return formatResponse(200, symptom, '症状获取成功');
  }

  // 根据ID获取症状图片
  async findImage(id: number) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
    });
    
    if (!symptom) {
      throw new RpcException({
        code: 404,
        message: `症状不存在`,
      });
    }

    if (!symptom.imageUrl) {
      throw new RpcException({
        code: 404,
        message: `症状图片不存在`,
      });
    }

    try {
      let imageData: { mimeType: string; fileBuffer: string };
      
      if (symptom.imageUrl.startsWith('http://') || symptom.imageUrl.startsWith('https://')) {
        // 处理第三方 URL
        const response = await axios.get(symptom.imageUrl, {
          responseType: 'arraybuffer'
        });
        // 将 Buffer 转换为 base64 字符串
        const base64Data = Buffer.from(response.data).toString('base64');
        imageData = {
          mimeType: response.headers['content-type'] || 'application/octet-stream',
          fileBuffer: base64Data
        };
      } else if (symptom.imageUrl.startsWith('oss://')) {
        // 处理 OSS fileKey
        const fileKey = symptom.imageUrl.replace('oss://', '');
        // 生成临时访问 URL
        const signedUrl = await this.aliOssService.generateSignedUrl(fileKey, 3600); // 1小时有效期
        // 下载文件
        const response = await axios.get(signedUrl, {
          responseType: 'arraybuffer'
        });
        // 将 Buffer 转换为 base64 字符串
        const base64Data = Buffer.from(response.data).toString('base64');
        imageData = {
          mimeType: response.headers['content-type'] || 'application/octet-stream',
          fileBuffer: base64Data
        };
      } else {
        throw new RpcException({
          code: 400,
          message: '无效的图片资源格式',
        });
      }
    
      return imageData;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      
      if (axios.isAxiosError(error)) {
        throw new RpcException({
          code: error.response?.status || 500,
          message: `图片下载失败: ${error.message}`,
        });
      }
      
      throw new RpcException({
        code: 500,
        message: `图片获取失败: ${error.message}`,
      });
    }
  }

  // 更新症状
  async update(id: number, dto: UpdateSymptomDto) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
    });
    if (!symptom) {
      throw new RpcException({
        code: 404,
        message: `Symptom with ID ${id} not found`,
      });
    }
    Object.assign(symptom, dto);
    return formatResponse(200, symptom, '症状更新成功');
  }

  // 删除症状
  async remove(id: number) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
    });
    if (!symptom) {
      throw new RpcException({
        code: 404,
        message: `Symptom with ID ${id} not found`,
      });
    }
    await this.symptomRepository.remove(symptom);
    return formatResponse(204, null, '症状删除成功');
  }
}
