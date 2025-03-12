import { Test, TestingModule } from '@nestjs/testing';
import { FileOperationService } from './file-operation.service';

describe('FileOperationService', () => {
  let service: FileOperationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileOperationService],
    }).compile();

    service = module.get<FileOperationService>(FileOperationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
