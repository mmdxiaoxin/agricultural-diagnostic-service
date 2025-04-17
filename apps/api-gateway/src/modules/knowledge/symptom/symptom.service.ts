import { CreateSymptomDto } from '@common/dto/knowledge/create-symptom.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateSymptomDto } from '@common/dto/knowledge/update-symptom.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SymptomService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createSymptomDto: CreateSymptomDto) {
    return this.client.send(
      { cmd: 'symptom.create' },
      { dto: createSymptomDto },
    );
  }

  findAll() {
    return this.client.send({ cmd: 'symptom.get' }, {});
  }

  findList(query: PageQueryKeywordsDto) {
    return this.client.send({ cmd: 'symptom.get.list' }, { query });
  }

  findOne(id: number) {
    return this.client.send({ cmd: 'symptom.get.byId' }, { id });
  }

  async findImage(id: number, res: Response) {
    try {
      const result = await lastValueFrom(this.client.send<{mimeType: string, fileBuffer: string}>({ cmd: 'symptom.image.get' }, { id }));
      const buffer = Buffer.from(result.fileBuffer, 'base64');
      res.set('Content-Type', result.mimeType);
      res.send(buffer);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 500,
        message: `图片获取失败: ${error.message}`,
      });
    }
  }

  update(id: number, updateSymptomDto: UpdateSymptomDto) {
    return this.client.send(
      { cmd: 'symptom.update' },
      { id, dto: updateSymptomDto },
    );
  }

  remove(id: number) {
    return this.client.send({ cmd: 'symptom.delete' }, { id });
  }
}
