import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import * as fs from 'fs';

@Injectable()
export class AliOssService {
  private client: OSS;

  constructor(private configService: ConfigService) {
    const config = this.configService.get('aliOss');
    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
    });
  }

  async uploadFile(
    file: string | Buffer,
    fileKey: string,
  ): Promise<OSS.PutObjectResult> {
    try {
      let result: OSS.PutObjectResult;

      if (typeof file === 'string') {
        result = await this.client.put(fileKey, file);
        fs.unlinkSync(file);
      } else if (Buffer.isBuffer(file)) {
        result = await this.client.put(fileKey, file);
      } else {
        throw new Error('Invalid file type. Expected string or buffer.');
      }

      return result;
    } catch (error) {
      throw new Error(`Error uploading file to OSS: ${error.message}`);
    }
  }

  async deleteFile(fileKey: string): Promise<OSS.DeleteResult> {
    try {
      return await this.client.delete(fileKey);
    } catch (error) {
      throw new Error(`Error deleting file from OSS: ${error.message}`);
    }
  }

  async generateSignedUrl(
    fileKey: string,
    expirationTime: number,
  ): Promise<string> {
    try {
      return this.client.signatureUrl(fileKey, {
        expires: expirationTime,
      });
    } catch (error) {
      throw new Error(`Error generating signed URL: ${error.message}`);
    }
  }

  async generateBatchSignedUrls(
    directoryPrefix: string,
    expirationTime: number,
  ): Promise<Array<{ fileName: string; signedUrl: string }>> {
    try {
      const result = await this.client.listV2(
        {
          prefix: directoryPrefix,
          'max-keys': '1000',
        },
        {
          timeout: 60000,
        },
      );

      if (!result.objects) {
        return [];
      }

      return await Promise.all(
        result.objects.map(async (object) => ({
          fileName: object.name,
          signedUrl: await this.generateSignedUrl(object.name, expirationTime),
        })),
      );
    } catch (error) {
      throw new Error(`Error generating batch signed URLs: ${error.message}`);
    }
  }
}
