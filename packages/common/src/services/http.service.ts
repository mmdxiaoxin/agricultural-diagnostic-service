// packages/common/src/services/http.service.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Injectable } from '@nestjs/common';

export interface BaseResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

@Injectable()
export class HttpService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        return {
          code: error.response?.status || 500,
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
}
