import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { PageResult } from '@/core/http/types';
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
} from '../types/admin-user';

export type AdminRoleOption = {
  id: number;
  code: string;
  name: string;
  status: string;
};

const normalizePageResult = (result: PageResult<AdminUser>): PageResult<AdminUser> => ({
  ...result,
  items: result.items ?? [],
});

export const adminUserApi = {
  list: async (params: CrudListParams, options?: { force?: boolean }) => {
    const result = await http
      .Get<PageResult<AdminUser>>('/admin/system/users', { params })
      .send(options?.force);
    return normalizePageResult(result);
  },
  detail: (id: React.Key) => http.Get<AdminUser>(`/admin/system/users/${id}`).send(),
  create: (payload: AdminUserCreatePayload) =>
    http.Post<AdminUser>('/admin/system/users', payload).send(),
  update: (id: React.Key, payload: AdminUserUpdatePayload) =>
    http.Put<AdminUser>(`/admin/system/users/${id}`, payload).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/system/users/${id}`).send(),
  roleOptions: () => http.Get<AdminRoleOption[]>('/admin/system/users/role-options').send(),
};
