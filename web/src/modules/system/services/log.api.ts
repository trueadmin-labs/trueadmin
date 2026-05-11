import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { PageResult } from '@/core/http/types';
import type { AdminLoginLog, AdminOperationLog } from '../types/log';

const normalizePageResult = <TRecord>(result: PageResult<TRecord>): PageResult<TRecord> => ({
  ...result,
  items: result.items ?? [],
});

export const loginLogApi = {
  list: async (params: CrudListParams, options?: { force?: boolean }) => {
    const result = await http
      .Get<PageResult<AdminLoginLog>>('/admin/system-config/login-logs', { params })
      .send(options?.force);
    return normalizePageResult(result);
  },
};

export const operationLogApi = {
  list: async (params: CrudListParams, options?: { force?: boolean }) => {
    const result = await http
      .Get<PageResult<AdminOperationLog>>('/admin/system-config/operation-logs', { params })
      .send(options?.force);
    return normalizePageResult(result);
  },
};
