import { serializeCrudParams } from '@trueadmin/web-core/crud';
import type { CrudListParams } from './types';

type QueryParams = CrudListParams | Record<string, unknown>;

export const toCrudRequestParams = (params?: QueryParams) =>
  serializeCrudParams(params as CrudListParams | undefined).toString();

export const crudRequestOptions = (params?: QueryParams) => {
  const query = toCrudRequestParams(params);
  return query ? { params: query } : undefined;
};
