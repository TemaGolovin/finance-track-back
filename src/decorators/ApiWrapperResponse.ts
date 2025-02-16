import { applyDecorators, Type } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseWrapper } from 'src/constants/response-wrapper';

export const ApiWrapperOkResponse = <TModel extends Type<object>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(ResponseWrapper, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseWrapper) },
          {
            properties: {
              data: {
                type: 'object',
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiWrapperCreatedResponse = <TModel extends Type<object>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(ResponseWrapper, model),
    ApiCreatedResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseWrapper) },
          {
            properties: {
              data: {
                type: 'object',
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};
