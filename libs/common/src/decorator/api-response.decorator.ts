import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse as SwaggerApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

export class ApiResponseDto<T> {
  code: number;
  message: string;
  data: T | null;
}

export const ApiResponse = <TModel extends Type<any>>(
  status: number,
  description: string,
  model: TModel,
  isArray = false,
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
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
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : {
                    $ref: getSchemaPath(model),
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
