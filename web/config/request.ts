import { env } from './env';

export const requestConfig = {
  baseURL: env.apiBaseUrl,
  timeout: env.requestTimeout,
  enableMsw: env.enableMsw,
};
