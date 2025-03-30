import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KNOWLEDGE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(KNOWLEDGE_SERVICE_NAME) private readonly client: ClientProxy,
  ) {}
}
