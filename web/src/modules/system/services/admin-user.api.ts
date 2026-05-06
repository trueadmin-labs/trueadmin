import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { PageResult } from '@/core/http/types';
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
  list: async (params: CrudListParams) => {
    const result = await http.Get<PageResult<AdminUser>>('/admin/system/users', { params }).send();
    return normalizePageResult(result);
  },
  detail: (id: React.Key) => http.Get<AdminUser>(`/admin/system/users/${id}`).send(),
  create: (payload: AdminUserCreatePayload) =>
    http.Post<AdminUser>('/admin/system/users', payload).send(),
  update: (id: React.Key, payload: AdminUserUpdatePayload) =>
    http.Put<AdminUser>(`/admin/system/users/${id}`, payload).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/system/users/${id}`).send(),
};
