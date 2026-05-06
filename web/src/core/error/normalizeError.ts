import { ApiError } from './ApiError';

export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError('WEB.UNKNOWN', error.message);
  }

  return new ApiError('WEB.UNKNOWN', '未知错误');
};
