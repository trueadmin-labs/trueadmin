import { crudRequestOptions } from '@trueadmin/web-core/crud';
import type { PageResult } from '@trueadmin/web-core/http';
import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { AdminLoginLog, AdminOperationLog } from '../types/log';

const normalizePageResult = <TRecord>(result: PageResult<TRecord>): PageResult<TRecord> => ({
  ...result,
  items: result.items ?? [],
});

export const loginLogApi = {
  list: async (params: CrudListParams, options?: { force?: boolean }) => {
    const result = await http
      .Get<PageResult<AdminLoginLog>>('/admin/system-config/login-logs', crudRequestOptions(params))
      .send(options?.force);
    return normalizePageResult(result);
  },
  detail: (id: React.Key) =>
    http.Get<AdminLoginLog>(`/admin/system-config/login-logs/${id}`).send(),
};

export const operationLogApi = {
  list: async (params: CrudListParams, options?: { force?: boolean }) => {
    const result = await http
      .Get<PageResult<AdminOperationLog>>(
        '/admin/system-config/operation-logs',
        crudRequestOptions(params),
      )
      .send(options?.force);
    return normalizePageResult(result);
  },
  detail: (id: React.Key) =>
    http.Get<AdminOperationLog>(`/admin/system-config/operation-logs/${id}`).send(),
};
