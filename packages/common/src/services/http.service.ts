// packages/common/src/services/http.service.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { Injectable, Logger } from '@nestjs/common';

export interface BaseResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

@Injectable()
export class HttpService {
  private readonly axiosInstance: AxiosInstance;
  private readonly logger = new Logger(HttpService.name);

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // 检查响应数据是否有效
        if (!response.data) {
          return {
            code: 500,
            message: '响应数据为空',
            data: null,
          };
        }
        return response.data;
      },
      (error) => {
        this.logger.error(`HTTP请求失败: ${JSON.stringify(error)}`);

        // 处理不同类型的错误
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const data = error.response?.data;

          return {
            code: status || 500,
            message: data?.message || error.message || '请求失败',
            data: data || null,
          };
        }

        return {
          code: 500,
          message: error.message || '请求失败',
          data: null,
        };
      },
    );
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<BaseResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<BaseResponse<T>> {
    return this.axiosInstance.get(url, config);
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<BaseResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<BaseResponse<T>> {
    return this.axiosInstance.delete(url, config);
  }
}
