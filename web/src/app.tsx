import type { RequestConfig } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { errorConfig } from './requestErrorConfig';

export { getInitialState, layout } from '@/core/app';

dayjs.extend(relativeTime);

export const request: RequestConfig = {
  baseURL: '',
  ...errorConfig,
};
