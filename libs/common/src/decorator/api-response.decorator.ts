import { applyDecorators, Type, HttpStatus } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiProperty,
  ApiResponse as SwaggerApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    description: '状态码',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: '响应消息',
    example: '操作成功',
  })
  message: string;

  @ApiProperty({
    description: '响应数据',
    nullable: true,
  })
  data: T | null;
}

export const ApiResponse = <TModel extends Type<any> = any>(
  status: number,
  description: string,
  model?: TModel,
  isArray = false,
) => {
  if (status === HttpStatus.NO_CONTENT) {
    return SwaggerApiResponse({
      status,
      description,
    });
  }

  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model || Object),
    SwaggerApiResponse({
      status,
      description,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: status,
              },
              message: {
                type: 'string',
                example: description,
              },
              data: model
                ? isArray
                  ? {
                      type: 'array',
                      items: { $ref: getSchemaPath(model) },
                    }
                  : {
                      $ref: getSchemaPath(model),
                    }
                : {
                    type: 'object',
                    additionalProperties: true,
                  },
            },
            required: ['code', 'message', 'data'],
          },
        },
      },
    }),
  );
};

// 添加网页响应装饰器
export const ApiHtmlResponse = (
  status: number,
  description: string,
  contentType: string = 'text/html',
) => {
  return SwaggerApiResponse({
    status,
    description,
    content: {
      [contentType]: {
        schema: {
          type: 'string',
          format: 'html',
        },
      },
    },
  });
};

// 添加联合类型响应装饰器
export const ApiUnionResponse = <TModels extends Type<any>[]>(
  status: number,
  description: string,
  models: TModels,
) => {
  if (status === HttpStatus.NO_CONTENT) {
    return SwaggerApiResponse({
      status,
      description,
    });
  }

  return applyDecorators(
    ApiExtraModels(ApiResponseDto, ...models),
    SwaggerApiResponse({
      status,
      description,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: status,
              },
              message: {
                type: 'string',
                example: description,
              },
              data: {
                oneOf: models.map((model) => ({
                  $ref: getSchemaPath(model),
                })),
              },
            },
            required: ['code', 'message', 'data'],
          },
        },
      },
    }),
  );
};

export const ApiNullResponse = (status: number, description: string) => {
  if (status === HttpStatus.NO_CONTENT) {
    return SwaggerApiResponse({
      status,
      description,
    });
  }

  return SwaggerApiResponse({
    status,
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              example: status,
            },
            message: {
              type: 'string',
              example: description,
            },
            data: {
              type: 'null',
              example: null,
            },
          },
        },
      },
    },
  });
};

export const ApiErrorResponse = (status: number, description: string) => {
  return SwaggerApiResponse({
    status,
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              example: status,
            },
            message: {
              type: 'string',
              example: description,
            },
            data: {
              type: 'null',
              example: null,
            },
          },
        },
      },
    },
  });
};

export const ApiBinaryResponse = (
  status: number,
  description: string,
  mimeType: string = 'application/octet-stream',
) => {
  return SwaggerApiResponse({
    status,
    description,
    content: {
      [mimeType]: {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  });
};
