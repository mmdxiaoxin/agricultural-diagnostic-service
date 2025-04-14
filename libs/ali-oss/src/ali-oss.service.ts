import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';

// 默认请求头配置
const defaultHeaders: OSS.PutObjectOptions['headers'] = {
  // 指定Object的存储类型
  'x-oss-storage-class': 'Standard',
  // 指定Object的访问权限
  'x-oss-object-acl': 'private',
  // 通过文件URL访问文件时，指定以附件形式下载文件
  'Content-Disposition': 'attachment',
  // 设置Object的标签
  'x-oss-tagging': 'Tag1=disease',
  // 指定PutObject操作时是否覆盖同名目标Object
  'x-oss-forbid-overwrite': 'true',
};

// 自定义上传选项
interface UploadOptions extends Partial<OSS.PutObjectOptions> {
  filename?: string;
}

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
    file: Buffer,
    fileKey: string,
    options: UploadOptions = {},
  ): Promise<OSS.PutObjectResult> {
    try {
      // 合并默认请求头和自定义请求头
      const headers = {
        ...defaultHeaders,
        ...options.headers,
        // 如果提供了文件名，更新Content-Disposition
        ...(options.filename && {
          'Content-Disposition': `attachment; filename="${options.filename}"`,
        }),
      };

      return await this.client.put(fileKey, file, {
        ...options,
        headers,
      });
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
