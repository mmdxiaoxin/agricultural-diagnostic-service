import { CreateAiServiceDto } from '@common/dto/ai-service/create-ai-service.dto';
import { UpdateAiServiceDto } from '@common/dto/ai-service/update-ai-service.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AiServiceService {
  create(createAiServiceDto: CreateAiServiceDto) {
    return 'This action adds a new aiService';
  }

  findAll() {
    return `This action returns all aiService`;
  }

  findList(page: number, pageSize: number) {}

  findOne(id: number) {
    return `This action returns a #${id} aiService`;
  }

  update(id: number, updateAiServiceDto: UpdateAiServiceDto) {
    return `This action updates a #${id} aiService`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiService`;
  }
}
