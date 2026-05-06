import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message } from 'antd';
import { clearAccessToken, getAccessToken } from '@/core/auth/token';

interface ResponseStructure {
  code: string;
  message: string;
  data: unknown;
}

type RequestError = Error & {
  info?: ResponseStructure;
  response?: { status?: number | string };
  request?: unknown;
};

type ErrorHandlerOptions = {
  skipErrorHandler?: boolean;
};

const toRequestError = (error: unknown): RequestError => {
  if (error instanceof Error) {
    return error as RequestError;
  }

  return new Error('Unknown request error') as RequestError;
};

const isTrueAdminResponse = (res: unknown): res is ResponseStructure => {
  return (
    !!res &&
    typeof res === 'object' &&
    'code' in res &&
    'message' in res &&
    'data' in res
  );
};

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      if (!isTrueAdminResponse(res) || res.code === 'SUCCESS') {
        return;
      }

      const error: Error & { info?: ResponseStructure } = new Error(
        res.message,
      );
      error.name = 'BizError';
      error.info = res;
      throw error;
    },
    errorHandler: (error: unknown, opts?: ErrorHandlerOptions) => {
      if (opts?.skipErrorHandler) throw error;

      const requestError = toRequestError(error);

      if (requestError.name === 'BizError') {
        const errorInfo = requestError.info;
        if (!errorInfo) {
          message.error('请求失败');
          return;
        }

        if (errorInfo.code === 'KERNEL.AUTH.UNAUTHORIZED') {
          clearAccessToken();
          history.replace('/user/login');
          return;
        }

        message.error(errorInfo.message || '请求失败');
        return;
      }

      if (requestError.response) {
        message.error(`请求失败：${requestError.response.status}`);
        return;
      }

      if (requestError.request) {
        message.error('服务暂时不可用，请稍后重试');
        return;
      }

      message.error('请求异常，请稍后重试');
    },
  },

  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getAccessToken();
      if (!token) {
        return config;
      }

      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    },
  ],
};
