import { crudRequestOptions } from '@trueadmin/web-core/crud';
import type { PageResult } from '@trueadmin/web-core/http';
import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
} from '../types/admin-user';

const normalizePageResult = (result: PageResult<AdminUser>): PageResult<AdminUser> => ({
  ...result,
  items: result.items ?? [],
});

export const adminUserApi = {
  list: async (params: CrudListParams, options?: { force?: boolean }) => {
    const result = await http
      .Get<PageResult<AdminUser>>('/admin/organization/users', crudRequestOptions(params))
      .send(options?.force);
    return normalizePageResult(result);
  },
  detail: (id: React.Key) => http.Get<AdminUser>(`/admin/organization/users/${id}`).send(),
  create: (payload: AdminUserCreatePayload) =>
    http.Post<AdminUser>('/admin/organization/users', payload).send(),
  update: (id: React.Key, payload: AdminUserUpdatePayload) =>
    http.Put<AdminUser>(`/admin/organization/users/${id}`, payload).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/organization/users/${id}`).send(),
};
