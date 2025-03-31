import { CreateCropDto } from '@common/dto/knowledge/create-crop.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateCropDto } from '@common/dto/knowledge/update-crop.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class CropService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}

  create(createCropDto: CreateCropDto) {
    return this.client.send({ cmd: 'crop.create' }, { dto: createCropDto });
  }

  findAll() {
    return this.client.send({ cmd: 'crop.get' }, {});
  }

  findList(query: PageQueryKeywordsDto) {
    return this.client.send({ cmd: 'crop.get.list' }, { query });
  }

  findOne(id: number) {
    return this.client.send({ cmd: 'crop.get.byId' }, { id });
  }

  update(id: number, updateCropDto: UpdateCropDto) {
    return this.client.send({ cmd: 'crop.update' }, { id, dto: updateCropDto });
  }

  remove(id: number) {
    return this.client.send({ cmd: 'crop.delete' }, { id });
  }
}
