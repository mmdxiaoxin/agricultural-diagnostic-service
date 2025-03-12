import { Test, TestingModule } from '@nestjs/testing';
import { DownloadServiceController } from './download-service.controller';
import { DownloadServiceService } from './download-service.service';

describe('DownloadServiceController', () => {
  let downloadServiceController: DownloadServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DownloadServiceController],
      providers: [DownloadServiceService],
    }).compile();

    downloadServiceController = app.get<DownloadServiceController>(DownloadServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(downloadServiceController.getHello()).toBe('Hello World!');
    });
  });
});
