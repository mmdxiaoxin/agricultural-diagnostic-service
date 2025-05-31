import {
  GetAvatarRequest,
  GetAvatarResponse,
  UploadAvatarRequest,
  UploadAvatarResponse,
} from '@common/types/user';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Controller()
export class UserGrpcController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'UploadAvatar')
  async uploadAvatar(
    request: UploadAvatarRequest,
  ): Promise<UploadAvatarResponse> {
    try {
      const result = await this.userService.updateAvatar(
        request.userId,
        Buffer.from(request.fileData, 'base64'),
        request.mimetype,
      );

      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '上传头像失败',
      };
    }
  }

  @GrpcMethod('UserService', 'GetAvatar')
  getAvatar(request: GetAvatarRequest): Observable<GetAvatarResponse> {
    return new Observable<GetAvatarResponse>((subscriber) => {
      this.userService
        .getAvatar(request.userId)
        .then((result) => {
          if (!result.data || !('buffer' in result.data)) {
            subscriber.next({
              success: false,
              message: '未找到头像数据',
            });
            subscriber.complete();
            return;
          }

          const buffer = result.data.buffer;
          const chunkSize = 64 * 1024; // 64KB chunks
          const totalChunks = Math.ceil(buffer.length / chunkSize);

          // 首先发送元数据
          subscriber.next({
            success: true,
            message: result.message,
            metadata: {
              fileName: result.data.fileName,
              mimeType: result.data.mimeType,
              totalSize: buffer.length,
            },
          });

          // 然后分块发送数据
          for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, buffer.length);
            const chunk = buffer.slice(start, end);

            subscriber.next({
              success: true,
              message: result.message,
              chunk,
            });
          }

          subscriber.complete();
        })
        .catch((error) => {
          subscriber.next({
            success: false,
            message: error.message || '获取头像失败',
          });
          subscriber.complete();
        });
    });
  }
}
