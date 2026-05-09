import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { PageResult } from '@/core/http/types';

export type AdminRoleOption = {
  id: number;
  parentId: number;
  code: string;
  name: string;
  level: number;
  path: string;
  sort: number;
  status: string;
};

export type AdminRoleTreeNode = AdminRoleOption & {
  children?: AdminRoleTreeNode[];
};

export const roleApi = {
  list: (params: CrudListParams) => http.Get<PageResult<AdminRoleOption>>('/admin/system/roles', { params }).send(),
  tree: (params?: CrudListParams) => http.Get<AdminRoleTreeNode[]>('/admin/system/roles/tree', { params }).send(),
  options: () => http.Get<AdminRoleOption[]>('/admin/system/roles/options').send(),
};
